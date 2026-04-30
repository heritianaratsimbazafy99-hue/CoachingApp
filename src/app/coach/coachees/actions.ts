"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { canMessageUser } from "@/services/messaging-service";
import { parseReminderTemplateTitle } from "@/utils/reminders";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const goalSchema = z.object({
  coacheeId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
  dueDate: z.string().trim().optional(),
  title: z
    .string()
    .trim()
    .min(2, "L'objectif doit contenir au moins 2 caractères.")
    .max(160, "L'objectif est trop long."),
});

const goalStatusSchema = z.object({
  coacheeId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
  goalId: z.string().trim().regex(uuidPattern, "Objectif invalide."),
  status: z.enum(["active", "completed", "paused"]),
});

const deleteGoalSchema = z.object({
  coacheeId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
  goalId: z.string().trim().regex(uuidPattern, "Objectif invalide."),
});

const noteSchema = z.object({
  coacheeId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
  note: z
    .string()
    .trim()
    .min(2, "La note doit contenir au moins 2 caractères.")
    .max(1600, "La note est trop longue."),
});

const reminderSchema = z.object({
  coacheeId: z.string().trim().regex(uuidPattern, "Coaché invalide."),
  templateId: z.string().trim().regex(uuidPattern, "Template invalide."),
});

export type CoachGoalActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type CoachNoteActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

export type CoachReminderActionState = {
  message: string;
  status: "error" | "idle" | "success";
};

function nullableDate(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function revalidateCoacheePaths(coacheeId: string) {
  revalidatePath("/coach/coachees");
  revalidatePath(`/coach/coachees/${coacheeId}`);
  revalidatePath("/coachee/profile");
}

export async function createCoacheeGoalAction(
  _previousState: CoachGoalActionState,
  formData: FormData,
): Promise<CoachGoalActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = goalSchema.safeParse({
    coacheeId: formData.get("coacheeId"),
    dueDate: formData.get("dueDate"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de l'objectif sont invalides.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("coachee_goals")
    .insert({
      coach_id: currentUser.user.id,
      coachee_id: parsed.data.coacheeId,
      due_date: nullableDate(parsed.data.dueDate),
      status: "active",
      title: parsed.data.title,
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
    action: `Objectif créé : ${parsed.data.title}`,
    entity_id: data.id,
    entity_type: "coachee_goal",
    user_id: currentUser.user.id,
  });

  revalidateCoacheePaths(parsed.data.coacheeId);

  return {
    message: "Objectif créé.",
    status: "success",
  };
}

export async function updateCoacheeGoalStatusAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = goalStatusSchema.safeParse({
    coacheeId: formData.get("coacheeId"),
    goalId: formData.get("goalId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("coachee_goals")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.goalId)
    .eq("coachee_id", parsed.data.coacheeId);

  if (currentUser.role !== "admin") {
    query = query.eq("coach_id", currentUser.user.id);
  }

  const { data, error } = await query.select("id,title").maybeSingle();

  if (error || !data) {
    return;
  }

  await supabase.from("activity_logs").insert({
    action: `Statut objectif mis à jour : ${data.title}`,
    entity_id: data.id,
    entity_type: "coachee_goal",
    user_id: currentUser.user.id,
  });

  revalidateCoacheePaths(parsed.data.coacheeId);
}

export async function deleteCoacheeGoalAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = deleteGoalSchema.safeParse({
    coacheeId: formData.get("coacheeId"),
    goalId: formData.get("goalId"),
  });

  if (!parsed.success) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("coachee_goals")
    .delete()
    .eq("id", parsed.data.goalId)
    .eq("coachee_id", parsed.data.coacheeId);

  if (currentUser.role !== "admin") {
    query = query.eq("coach_id", currentUser.user.id);
  }

  await query;
  revalidateCoacheePaths(parsed.data.coacheeId);
}

export async function createCoachNoteAction(
  _previousState: CoachNoteActionState,
  formData: FormData,
): Promise<CoachNoteActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = noteSchema.safeParse({
    coacheeId: formData.get("coacheeId"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de la note sont invalides.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("coach_notes")
    .insert({
      coach_id: currentUser.user.id,
      coachee_id: parsed.data.coacheeId,
      note: parsed.data.note,
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
    action: "Note privée coach ajoutée",
    entity_id: data.id,
    entity_type: "coach_note",
    user_id: currentUser.user.id,
  });

  revalidatePath(`/coach/coachees/${parsed.data.coacheeId}`);

  return {
    message: "Note enregistrée.",
    status: "success",
  };
}

export async function sendReminderTemplateAction(
  _previousState: CoachReminderActionState,
  formData: FormData,
): Promise<CoachReminderActionState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = reminderSchema.safeParse({
    coacheeId: formData.get("coacheeId"),
    templateId: formData.get("templateId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "La relance contient des champs invalides.",
      status: "error",
    };
  }

  const allowed = await canMessageUser(parsed.data.coacheeId);

  if (!allowed) {
    return {
      message: "Cette conversation n'est pas autorisée.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  let templateQuery = supabase
    .from("reminder_templates")
    .select("id,title,body")
    .eq("id", parsed.data.templateId);

  if (currentUser.role !== "admin") {
    templateQuery = templateQuery.eq("coach_id", currentUser.user.id);
  }

  const { data: template, error: templateError } = await templateQuery.maybeSingle();

  if (templateError) {
    return {
      message: templateError.message,
      status: "error",
    };
  }

  if (!template) {
    return {
      message: "Template introuvable ou non autorisé.",
      status: "error",
    };
  }

  const templateTitle = parseReminderTemplateTitle(template.title);
  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      body: template.body,
      receiver_id: parsed.data.coacheeId,
      sender_id: currentUser.user.id,
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
    action: `Relance envoyée : ${templateTitle.title}`,
    entity_id: message.id,
    entity_type: "message",
    metadata: {
      coacheeId: parsed.data.coacheeId,
      reminderTemplateId: template.id,
      reminderTitle: templateTitle.title,
      reminderType: templateTitle.usage,
    },
    user_id: currentUser.user.id,
  });

  revalidatePath("/coach/coachees");
  revalidatePath(`/coach/coachees/${parsed.data.coacheeId}`);
  revalidatePath("/coach/messages");
  revalidatePath("/coachee/messages");

  return {
    message: "Relance envoyée.",
    status: "success",
  };
}
