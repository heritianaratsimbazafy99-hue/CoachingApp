"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assignCoacheeSchema = z.object({
  cohortId: z.string().trim().regex(uuidPattern, "Cohorte invalide."),
  userId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
});

const changeCoachSchema = assignCoacheeSchema.extend({
  coachId: z.string().trim().regex(uuidPattern, "Coach invalide."),
});

const toggleCoacheeStatusSchema = z.object({
  statusAction: z.enum(["disable", "enable"]),
  userId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
});

export type AdminCoacheeActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

function revalidateAdminCoacheePaths(cohortId?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/coachees");
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

function friendlyMemberError(message: string) {
  if (message.toLowerCase().includes("duplicate")) {
    return "Ce coaché est déjà membre de cette cohorte.";
  }

  return message;
}

function isFutureBanDate(value: string | undefined) {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

async function getProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,user_id,role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getCohort(cohortId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cohorts")
    .select("id,name,coach_id")
    .eq("id", cohortId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function isCoacheeMemberOfCohort(userId: string, cohortId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("cohort_members")
    .select("id")
    .eq("cohort_id", cohortId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data);
}

async function ensureCoachee(userId: string) {
  const profile = await getProfile(userId);

  if (!profile || profile.role !== "coachee") {
    return null;
  }

  return profile;
}

async function ensureActiveCoach(coachId: string) {
  const profile = await getProfile(coachId);

  if (!profile || profile.role !== "coach") {
    return null;
  }

  const adminSupabase = createServiceSupabaseClient();
  const { data, error } = await adminSupabase.auth.admin.getUserById(coachId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user || isFutureBanDate(data.user.banned_until)) {
    return null;
  }

  return profile;
}

export async function assignAdminCoacheeToCohortAction(
  _previousState: AdminCoacheeActionState,
  formData: FormData,
): Promise<AdminCoacheeActionState> {
  const currentUser = await requireRole("admin");
  const parsed = assignCoacheeSchema.safeParse({
    cohortId: formData.get("cohortId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs d'affectation sont invalides.",
      status: "error",
    };
  }

  try {
    const [coachee, cohort] = await Promise.all([
      ensureCoachee(parsed.data.userId),
      getCohort(parsed.data.cohortId),
    ]);

    if (!coachee) {
      return {
        message: "Coaché introuvable.",
        status: "error",
      };
    }

    if (!cohort) {
      return {
        message: "Cohorte introuvable.",
        status: "error",
      };
    }

    const supabase = await createServerSupabaseClient();
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
      action: `Coaché affecté à une cohorte : ${coachee.full_name}`,
      entity_id: cohort.id,
      entity_type: "cohort",
      metadata: {
        coacheeId: coachee.user_id,
        coacheeName: coachee.full_name,
        cohortName: cohort.name,
      },
      user_id: currentUser.user.id,
    });

    revalidateAdminCoacheePaths(cohort.id);

    return {
      message: "Coaché assigné à la cohorte.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'assigner le coaché.",
      status: "error",
    };
  }
}

export async function changeAdminCoacheeCoachAction(
  _previousState: AdminCoacheeActionState,
  formData: FormData,
): Promise<AdminCoacheeActionState> {
  const currentUser = await requireRole("admin");
  const parsed = changeCoachSchema.safeParse({
    coachId: formData.get("coachId"),
    cohortId: formData.get("cohortId"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de changement de coach sont invalides.",
      status: "error",
    };
  }

  try {
    const [coachee, coach, cohort, isMember] = await Promise.all([
      ensureCoachee(parsed.data.userId),
      ensureActiveCoach(parsed.data.coachId),
      getCohort(parsed.data.cohortId),
      isCoacheeMemberOfCohort(parsed.data.userId, parsed.data.cohortId),
    ]);

    if (!coachee) {
      return {
        message: "Coaché introuvable.",
        status: "error",
      };
    }

    if (!coach) {
      return {
        message: "Coach actif introuvable.",
        status: "error",
      };
    }

    if (!cohort || !isMember) {
      return {
        message: "Le coaché n'est pas membre de cette cohorte.",
        status: "error",
      };
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("cohorts")
      .update({ coach_id: coach.user_id })
      .eq("id", cohort.id);

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    await supabase.from("activity_logs").insert({
      action: `Coach responsable changé : ${cohort.name}`,
      entity_id: cohort.id,
      entity_type: "cohort",
      metadata: {
        coachId: coach.user_id,
        coachName: coach.full_name,
        coacheeId: coachee.user_id,
        coacheeName: coachee.full_name,
      },
      user_id: currentUser.user.id,
    });

    revalidateAdminCoacheePaths(cohort.id);

    return {
      message: "Coach responsable mis à jour.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de changer le coach.",
      status: "error",
    };
  }
}

export async function toggleAdminCoacheeStatusAction(
  _previousState: AdminCoacheeActionState,
  formData: FormData,
): Promise<AdminCoacheeActionState> {
  const currentUser = await requireRole("admin");
  const parsed = toggleCoacheeStatusSchema.safeParse({
    statusAction: formData.get("statusAction"),
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Coaché invalide.",
      status: "error",
    };
  }

  try {
    const coachee = await ensureCoachee(parsed.data.userId);

    if (!coachee) {
      return {
        message: "Coaché introuvable.",
        status: "error",
      };
    }

    const adminSupabase = createServiceSupabaseClient();
    const { error } = await adminSupabase.auth.admin.updateUserById(
      coachee.user_id,
      {
        ban_duration:
          parsed.data.statusAction === "disable" ? "876000h" : "none",
      },
    );

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    const supabase = await createServerSupabaseClient();
    await supabase.from("activity_logs").insert({
      action:
        parsed.data.statusAction === "disable"
          ? `Coaché désactivé : ${coachee.full_name}`
          : `Coaché réactivé : ${coachee.full_name}`,
      entity_id: coachee.user_id,
      entity_type: "profile",
      user_id: currentUser.user.id,
    });

    revalidateAdminCoacheePaths();

    return {
      message:
        parsed.data.statusAction === "disable"
          ? "Compte coaché désactivé."
          : "Compte coaché réactivé.",
      status: "success",
    };
  } catch (error) {
    return {
      message:
        error instanceof Error
          ? error.message
          : "Impossible de mettre à jour le statut du coaché.",
      status: "error",
    };
  }
}
