"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { AssignmentType } from "@/types/coaching";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || uuidPattern.test(value), {
    message: "Identifiant invalide.",
  });

const assignmentSchema = z.object({
  contentId: optionalUuid,
  deadline: z.string().trim().min(1, "La deadline est obligatoire."),
  description: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
  priority: z.enum(["normal", "high"]),
  quizId: optionalUuid,
  target: z.string().trim().min(1, "Choisis une cible."),
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères."),
});

export type CreateAssignmentState = {
  message: string;
  status: "error" | "idle";
};

function parseTarget(value: string) {
  const [type, id] = value.split(":");

  if ((type !== "coachee" && type !== "cohort") || !uuidPattern.test(id ?? "")) {
    return null;
  }

  return {
    id,
    type,
  };
}

function getAssignmentType(contentId: string, quizId: string): AssignmentType {
  if (contentId && quizId) {
    return "content_quiz";
  }

  return contentId ? "content" : "quiz";
}

function toDeadlineIso(value: string) {
  return new Date(`${value}T23:59:00`).toISOString();
}

export async function createAssignmentAction(
  _previousState: CreateAssignmentState,
  formData: FormData,
): Promise<CreateAssignmentState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = assignmentSchema.safeParse({
    contentId: formData.get("contentId"),
    deadline: formData.get("deadline"),
    description: formData.get("description"),
    instructions: formData.get("instructions"),
    priority: formData.get("priority"),
    quizId: formData.get("quizId"),
    target: formData.get("target"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de l'assignation sont invalides.",
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

  if (!values.contentId && !values.quizId) {
    return {
      message: "Choisis au moins un contenu ou un quiz.",
      status: "error",
    };
  }

  const deadline = toDeadlineIso(values.deadline);

  if (Number.isNaN(new Date(deadline).getTime())) {
    return {
      message: "La deadline est invalide.",
      status: "error",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      assigned_by: currentUser.user.id,
      assigned_to_cohort_id: target.type === "cohort" ? target.id : null,
      assigned_to_user_id: target.type === "coachee" ? target.id : null,
      assignment_type: getAssignmentType(values.contentId, values.quizId),
      content_id: values.contentId || null,
      deadline,
      description: values.description || null,
      instructions: values.instructions || null,
      priority: values.priority,
      quiz_id: values.quizId || null,
      status: "assigned",
      title: values.title,
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
    action: `Assignation créée : ${values.title}`,
    entity_id: data.id,
    entity_type: "assignment",
    user_id: currentUser.user.id,
  });

  revalidatePath("/coach");
  revalidatePath("/coach/assignments");
  revalidatePath("/coach/coachees");
  revalidatePath("/coach/cohorts");

  redirect("/coach/assignments");
}
