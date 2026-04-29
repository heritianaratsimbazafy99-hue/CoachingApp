"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const calendarEventSchema = z.object({
  description: z.string().trim().max(1200, "La description est trop longue."),
  endAt: z.string().trim().min(1, "La fin est obligatoire."),
  startAt: z.string().trim().min(1, "Le début est obligatoire."),
  target: z.string().trim().min(1, "Choisis une cible."),
  title: z
    .string()
    .trim()
    .min(2, "Le titre doit contenir au moins 2 caractères.")
    .max(140, "Le titre est trop long."),
  type: z.enum([
    "individual_coaching",
    "collective_workshop",
    "info_meeting",
    "reminder",
  ]),
});

const calendarStatusSchema = z.object({
  eventId: z.string().trim().regex(uuidPattern, "Événement invalide."),
  status: z.enum(["scheduled", "done", "cancelled"]),
});

export type CreateCalendarEventState = {
  message: string;
  status: "error" | "idle" | "success";
};

function nullableText(value: string) {
  return value.trim() ? value.trim() : null;
}

function parseTarget(value: string) {
  if (value === "coach") {
    return {
      coacheeId: null,
      cohortId: null,
      type: "coach" as const,
    };
  }

  const [type, id] = value.split(":");

  if ((type !== "coachee" && type !== "cohort") || !uuidPattern.test(id ?? "")) {
    return null;
  }

  return {
    coacheeId: type === "coachee" ? id : null,
    cohortId: type === "cohort" ? id : null,
    type,
  };
}

function parseDateTime(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

async function validateTarget(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  currentUserId: string,
  isAdmin: boolean,
  target: NonNullable<ReturnType<typeof parseTarget>>,
) {
  if (target.type === "coach") {
    return true;
  }

  if (target.type === "cohort" && target.cohortId) {
    let query = supabase.from("cohorts").select("id").eq("id", target.cohortId);

    if (!isAdmin) {
      query = query.eq("coach_id", currentUserId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data);
  }

  if (target.type === "coachee" && target.coacheeId) {
    if (isAdmin) {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("role", "coachee")
        .eq("user_id", target.coacheeId)
        .maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      return Boolean(data);
    }

    const { data: cohorts, error: cohortError } = await supabase
      .from("cohorts")
      .select("id")
      .eq("coach_id", currentUserId);

    if (cohortError) {
      throw new Error(cohortError.message);
    }

    const cohortIds = (cohorts ?? []).map((cohort) => cohort.id);

    if (!cohortIds.length) {
      return false;
    }

    const { data, error } = await supabase
      .from("cohort_members")
      .select("id")
      .eq("user_id", target.coacheeId)
      .in("cohort_id", cohortIds)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    return Boolean(data?.length);
  }

  return false;
}

function revalidateCalendarPaths() {
  revalidatePath("/coach");
  revalidatePath("/coach/calendar");
  revalidatePath("/coachee");
  revalidatePath("/coachee/calendar");
}

export async function createCalendarEventAction(
  _previousState: CreateCalendarEventState,
  formData: FormData,
): Promise<CreateCalendarEventState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = calendarEventSchema.safeParse({
    description: formData.get("description"),
    endAt: formData.get("endAt"),
    startAt: formData.get("startAt"),
    target: formData.get("target"),
    title: formData.get("title"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de l'événement sont invalides.",
      status: "error",
    };
  }

  const values = parsed.data;
  const target = parseTarget(values.target);

  if (!target) {
    return {
      message: "La cible sélectionnée est invalide.",
      status: "error",
    };
  }

  const startAt = parseDateTime(values.startAt);
  const endAt = parseDateTime(values.endAt);

  if (!startAt || !endAt || endAt <= startAt) {
    return {
      message: "La date de fin doit être après la date de début.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const isAdmin = currentUser.role === "admin";

  try {
    const targetAllowed = await validateTarget(
      supabase,
      currentUser.user.id,
      isAdmin,
      target,
    );

    if (!targetAllowed) {
      return {
        message: "Cette cible n'est pas autorisée pour ton agenda.",
        status: "error",
      };
    }
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Validation impossible.",
      status: "error",
    };
  }

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      coachee_id: target.coacheeId,
      coach_id: currentUser.user.id,
      cohort_id: target.cohortId,
      description: nullableText(values.description),
      end_time: endAt.toISOString(),
      start_time: startAt.toISOString(),
      status: "scheduled",
      title: values.title,
      type: values.type,
    })
    .select("id")
    .single();

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  await supabase.from("activity_logs").insert({
    action: `Événement agenda créé : ${values.title}`,
    entity_id: data.id,
    entity_type: "calendar_event",
    user_id: currentUser.user.id,
  });

  revalidateCalendarPaths();

  return {
    message: "Événement créé.",
    status: "success",
  };
}

export async function updateCalendarEventStatusAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = calendarStatusSchema.safeParse({
    eventId: formData.get("eventId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("calendar_events")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.eventId);

  if (currentUser.role !== "admin") {
    query = query.eq("coach_id", currentUser.user.id);
  }

  const { data, error } = await query.select("id,title").maybeSingle();

  if (error || !data) {
    return;
  }

  await supabase.from("activity_logs").insert({
    action: `Statut agenda mis à jour : ${data.title}`,
    entity_id: data.id,
    entity_type: "calendar_event",
    user_id: currentUser.user.id,
  });

  revalidateCalendarPaths();
}
