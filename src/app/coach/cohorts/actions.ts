"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const cohortSchema = z
  .object({
    description: z.string().trim().max(1000, "La description est trop longue."),
    endDate: z.string().trim().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caractères.")
      .max(120, "Le nom est trop long."),
    startDate: z.string().trim().optional(),
  })
  .refine(
    (value) =>
      !value.startDate ||
      !value.endDate ||
      new Date(value.endDate) >= new Date(value.startDate),
    {
      message: "La date de fin doit être après la date de début.",
      path: ["endDate"],
    },
  );

const cohortMemberSchema = z.object({
  cohortId: z.string().trim().regex(uuidPattern, "Cohorte invalide."),
  userId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
});

export type CohortActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

function nullableDate(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function revalidateCohortPaths(cohortId?: string) {
  revalidatePath("/coach");
  revalidatePath("/coach/coachees");
  revalidatePath("/coach/cohorts");

  if (cohortId) {
    revalidatePath(`/coach/cohorts/${cohortId}`);
  }
}

async function getWritableCohort(
  cohortId: string,
  currentUser: Awaited<ReturnType<typeof requireRole>>,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("cohorts")
    .select("id,name,coach_id")
    .eq("id", cohortId);

  if (currentUser.role !== "admin") {
    query = query.eq("coach_id", currentUser.user.id);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createCohortAction(
  _previousState: CohortActionState,
  formData: FormData,
): Promise<CohortActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = cohortSchema.safeParse({
    description: formData.get("description"),
    endDate: formData.get("endDate"),
    name: formData.get("name"),
    startDate: formData.get("startDate"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de la cohorte sont invalides.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cohorts")
    .insert({
      coach_id: currentUser.user.id,
      description: parsed.data.description || null,
      end_date: nullableDate(parsed.data.endDate),
      name: parsed.data.name,
      start_date: nullableDate(parsed.data.startDate),
    })
    .select("id,name")
    .single();

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  await supabase.from("activity_logs").insert({
    action: `Cohorte créée : ${data.name}`,
    entity_id: data.id,
    entity_type: "cohort",
    user_id: currentUser.user.id,
  });

  revalidateCohortPaths(data.id);

  return {
    message: "Cohorte créée.",
    status: "success",
  };
}

export async function addCohortMemberAction(
  _previousState: CohortActionState,
  formData: FormData,
): Promise<CohortActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = cohortMemberSchema.safeParse({
    cohortId: formData.get("cohortId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du membre sont invalides.",
      status: "error",
    };
  }

  const cohort = await getWritableCohort(parsed.data.cohortId, currentUser);

  if (!cohort) {
    return {
      message: "Cohorte introuvable ou non autorisée.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name,user_id,role")
    .eq("user_id", parsed.data.userId)
    .eq("role", "coachee")
    .maybeSingle();

  if (profileError) {
    return {
      message: profileError.message,
      status: "error",
    };
  }

  if (!profile) {
    return {
      message: "Coaché introuvable.",
      status: "error",
    };
  }

  const { error } = await supabase.from("cohort_members").insert({
    cohort_id: cohort.id,
    user_id: profile.user_id,
  });

  if (error) {
    return {
      message: error.message,
      status: "error",
    };
  }

  await supabase.from("activity_logs").insert({
    action: `Membre ajouté à ${cohort.name} : ${profile.full_name}`,
    entity_id: cohort.id,
    entity_type: "cohort",
    user_id: currentUser.user.id,
  });

  revalidateCohortPaths(cohort.id);

  return {
    message: "Membre ajouté.",
    status: "success",
  };
}

export async function removeCohortMemberAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = cohortMemberSchema.safeParse({
    cohortId: formData.get("cohortId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return;
  }

  const cohort = await getWritableCohort(parsed.data.cohortId, currentUser);

  if (!cohort) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("cohort_members")
    .delete()
    .eq("cohort_id", cohort.id)
    .eq("user_id", parsed.data.userId);

  await supabase.from("activity_logs").insert({
    action: `Membre retiré de ${cohort.name}`,
    entity_id: cohort.id,
    entity_type: "cohort",
    user_id: currentUser.user.id,
  });

  revalidateCohortPaths(cohort.id);
}
