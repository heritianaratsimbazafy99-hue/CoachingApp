"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const optionalDateSchema = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), {
    message: "Date invalide.",
  });

const cohortSchema = z
  .object({
    coachId: z.string().trim().regex(uuidPattern, "Coach invalide."),
    description: z.string().trim().max(1000, "La description est trop longue."),
    endDate: optionalDateSchema,
    name: z
      .string()
      .trim()
      .min(2, "Le nom doit contenir au moins 2 caractères.")
      .max(120, "Le nom est trop long."),
    startDate: optionalDateSchema,
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

const cohortIdSchema = z.object({
  cohortId: z.string().trim().regex(uuidPattern, "Cohorte invalide."),
});

const cohortUpdateSchema = cohortSchema.extend({
  cohortId: z.string().trim().regex(uuidPattern, "Cohorte invalide."),
});

const cohortMemberSchema = z.object({
  cohortId: z.string().trim().regex(uuidPattern, "Cohorte invalide."),
  userId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
});

export type AdminCohortActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialAdminCohortActionState: AdminCohortActionState = {
  message: "",
  status: "idle",
};

function nullableDate(value: string) {
  return value ? value : null;
}

function revalidateAdminCohortPaths(cohortId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/coaches");
  revalidatePath("/admin/cohorts");
  revalidatePath("/admin/stats");
  revalidatePath("/coach");
  revalidatePath("/coach/coachees");
  revalidatePath("/coach/cohorts");

  if (cohortId) {
    revalidatePath(`/coach/cohorts/${cohortId}`);
  }
}

async function ensureCoachExists(coachId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,user_id,role")
    .eq("user_id", coachId)
    .eq("role", "coach")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function ensureCoacheeExists(userId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,user_id,role")
    .eq("user_id", userId)
    .eq("role", "coachee")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getCohort(cohortId: string) {
  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select("id,name")
    .eq("id", cohortId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function getCohortInput(formData: FormData) {
  return {
    coachId: formData.get("coachId"),
    description: formData.get("description") ?? "",
    endDate: formData.get("endDate") ?? "",
    name: formData.get("name"),
    startDate: formData.get("startDate") ?? "",
  };
}

function friendlyMemberError(message: string) {
  if (message.toLowerCase().includes("duplicate")) {
    return "Ce coaché est déjà membre de cette cohorte.";
  }

  return message;
}

export async function createAdminCohortAction(
  _previousState: AdminCohortActionState,
  formData: FormData,
): Promise<AdminCohortActionState> {
  const currentUser = await requireRole("admin");
  const parsed = cohortSchema.safeParse(getCohortInput(formData));

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de la cohorte sont invalides.",
      status: "error",
    };
  }

  try {
    const coach = await ensureCoachExists(parsed.data.coachId);

    if (!coach) {
      return {
        message: "Coach introuvable.",
        status: "error",
      };
    }

    const supabase = createServiceSupabaseClient();
    const { data, error } = await supabase
      .from("cohorts")
      .insert({
        coach_id: coach.user_id,
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
      action: `Cohorte admin créée : ${data.name}`,
      entity_id: data.id,
      entity_type: "cohort",
      metadata: {
        coachId: coach.user_id,
        coachName: coach.full_name,
      },
      user_id: currentUser.user.id,
    });

    revalidateAdminCohortPaths(data.id);

    return {
      message: "Cohorte créée.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de créer la cohorte.",
      status: "error",
    };
  }
}

export async function updateAdminCohortAction(
  _previousState: AdminCohortActionState,
  formData: FormData,
): Promise<AdminCohortActionState> {
  const currentUser = await requireRole("admin");
  const parsed = cohortUpdateSchema.safeParse({
    cohortId: formData.get("cohortId"),
    ...getCohortInput(formData),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de la cohorte sont invalides.",
      status: "error",
    };
  }

  try {
    const [cohort, coach] = await Promise.all([
      getCohort(parsed.data.cohortId),
      ensureCoachExists(parsed.data.coachId),
    ]);

    if (!cohort) {
      return {
        message: "Cohorte introuvable.",
        status: "error",
      };
    }

    if (!coach) {
      return {
        message: "Coach introuvable.",
        status: "error",
      };
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("cohorts")
      .update({
        coach_id: coach.user_id,
        description: parsed.data.description || null,
        end_date: nullableDate(parsed.data.endDate),
        name: parsed.data.name,
        start_date: nullableDate(parsed.data.startDate),
      })
      .eq("id", cohort.id);

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    await supabase.from("activity_logs").insert({
      action: `Cohorte admin mise à jour : ${parsed.data.name}`,
      entity_id: cohort.id,
      entity_type: "cohort",
      metadata: {
        coachId: coach.user_id,
        coachName: coach.full_name,
      },
      user_id: currentUser.user.id,
    });

    revalidateAdminCohortPaths(cohort.id);

    return {
      message: "Cohorte mise à jour.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour la cohorte.",
      status: "error",
    };
  }
}

export async function deleteAdminCohortAction(
  _previousState: AdminCohortActionState,
  formData: FormData,
): Promise<AdminCohortActionState> {
  const currentUser = await requireRole("admin");
  const parsed = cohortIdSchema.safeParse({
    cohortId: formData.get("cohortId"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Cohorte invalide.",
      status: "error",
    };
  }

  try {
    const cohort = await getCohort(parsed.data.cohortId);

    if (!cohort) {
      return {
        message: "Cohorte introuvable.",
        status: "error",
      };
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("cohorts")
      .delete()
      .eq("id", cohort.id);

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    await supabase.from("activity_logs").insert({
      action: `Cohorte admin supprimée : ${cohort.name}`,
      entity_id: cohort.id,
      entity_type: "cohort",
      user_id: currentUser.user.id,
    });

    revalidateAdminCohortPaths(cohort.id);

    return {
      message: "Cohorte supprimée.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la cohorte.",
      status: "error",
    };
  }
}

export async function addAdminCohortMemberAction(
  _previousState: AdminCohortActionState,
  formData: FormData,
): Promise<AdminCohortActionState> {
  const currentUser = await requireRole("admin");
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

  try {
    const [cohort, coachee] = await Promise.all([
      getCohort(parsed.data.cohortId),
      ensureCoacheeExists(parsed.data.userId),
    ]);

    if (!cohort) {
      return {
        message: "Cohorte introuvable.",
        status: "error",
      };
    }

    if (!coachee) {
      return {
        message: "Coaché introuvable.",
        status: "error",
      };
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase.from("cohort_members").insert({
      cohort_id: cohort.id,
      user_id: coachee.user_id,
    });

    if (error) {
      return {
        message: friendlyMemberError(error.message),
        status: "error",
      };
    }

    await supabase.from("activity_logs").insert({
      action: `Membre admin ajouté à ${cohort.name} : ${coachee.full_name}`,
      entity_id: cohort.id,
      entity_type: "cohort",
      metadata: {
        coacheeId: coachee.user_id,
        coacheeName: coachee.full_name,
      },
      user_id: currentUser.user.id,
    });

    revalidateAdminCohortPaths(cohort.id);

    return {
      message: "Coaché ajouté.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'ajouter le coaché.",
      status: "error",
    };
  }
}

export async function removeAdminCohortMemberAction(
  _previousState: AdminCohortActionState,
  formData: FormData,
): Promise<AdminCohortActionState> {
  const currentUser = await requireRole("admin");
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

  try {
    const cohort = await getCohort(parsed.data.cohortId);

    if (!cohort) {
      return {
        message: "Cohorte introuvable.",
        status: "error",
      };
    }

    const supabase = createServiceSupabaseClient();
    const { error } = await supabase
      .from("cohort_members")
      .delete()
      .eq("cohort_id", cohort.id)
      .eq("user_id", parsed.data.userId);

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    await supabase.from("activity_logs").insert({
      action: `Membre admin retiré de ${cohort.name}`,
      entity_id: cohort.id,
      entity_type: "cohort",
      metadata: {
        coacheeId: parsed.data.userId,
      },
      user_id: currentUser.user.id,
    });

    revalidateAdminCohortPaths(cohort.id);

    return {
      message: "Coaché retiré.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de retirer le coaché.",
      status: "error",
    };
  }
}
