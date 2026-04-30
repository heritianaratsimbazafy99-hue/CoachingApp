"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sendQuizCorrectionAvailableEmail } from "@/services/transactional-email-service";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requiredUuid = z.string().trim().regex(uuidPattern, "Identifiant invalide.");

const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || uuidPattern.test(value), {
    message: "Identifiant invalide.",
  });

const quizSchema = z.object({
  contentId: optionalUuid,
  description: z.string().trim().optional(),
  passingScore: z.coerce
    .number()
    .min(0, "Le score minimum doit être au moins 0%.")
    .max(100, "Le score minimum doit être au maximum 100%."),
  quizId: optionalUuid,
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères."),
});

const questionSchema = z.object({
  correctOptions: z.string().trim().optional(),
  explanation: z.string().trim().optional(),
  options: z.string().trim().optional(),
  points: z.coerce
    .number()
    .min(0, "Les points doivent être positifs.")
    .max(100, "Une question ne peut pas dépasser 100 points."),
  questionText: z
    .string()
    .trim()
    .min(5, "La question doit contenir au moins 5 caractères."),
  questionType: z.enum(["single_choice", "multiple_choice", "open"]),
  quizId: requiredUuid,
});

const correctionSchema = z.object({
  answerId: requiredUuid,
  attemptId: requiredUuid,
  coachFeedback: z.string().trim().optional(),
  pointsObtained: z.coerce
    .number()
    .min(0, "Les points doivent être positifs.")
    .max(100, "La note saisie est trop élevée."),
});

export type FormState = {
  message: string;
  status: "error" | "idle" | "success";
};

export const initialFormState: FormState = {
  message: "",
  status: "idle",
};

function nullableText(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function nullableUuid(value: string) {
  return value ? value : null;
}

function parseOptionLines(value: string | undefined) {
  return (
    value
      ?.split("\n")
      .map((line) => line.trim())
      .filter(Boolean) ?? []
  );
}

function parseCorrectPositions(value: string | undefined) {
  return (
    value
      ?.split(/[,\s]+/)
      .map((part) => Number(part.trim()))
      .filter((position) => Number.isInteger(position) && position > 0) ?? []
  );
}

async function ensureWritableQuiz(
  quizId: string,
  currentUser: Awaited<ReturnType<typeof requireRole>>,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("quizzes").select("id,title").eq("id", quizId);

  if (currentUser.role !== "admin") {
    query = query.eq("created_by", currentUser.user.id);
  }

  const { data, error } = await query.maybeSingle<{ id: string; title: string }>();

  if (error) {
    return { error: error.message, supabase };
  }

  if (!data) {
    return { error: "Quiz introuvable ou non autorisé.", supabase };
  }

  return { quiz: data, supabase };
}

export async function saveQuizAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = quizSchema.safeParse({
    contentId: formData.get("contentId"),
    description: formData.get("description"),
    passingScore: formData.get("passingScore"),
    quizId: formData.get("quizId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du quiz sont invalides.",
      status: "error",
    };
  }

  const values = parsed.data;
  const supabase = await createServerSupabaseClient();
  const payload = {
    content_id: nullableUuid(values.contentId),
    description: nullableText(values.description),
    passing_score: values.passingScore,
    title: values.title,
    updated_at: new Date().toISOString(),
  };
  let savedQuizId = values.quizId;

  if (values.quizId) {
    let query = supabase.from("quizzes").update(payload).eq("id", values.quizId);

    if (currentUser.role !== "admin") {
      query = query.eq("created_by", currentUser.user.id);
    }

    const { data, error } = await query.select("id").maybeSingle<{ id: string }>();

    if (error) {
      return { message: error.message, status: "error" };
    }

    if (!data) {
      return {
        message: "Quiz introuvable ou non autorisé.",
        status: "error",
      };
    }
  } else {
    const { data, error } = await supabase
      .from("quizzes")
      .insert({
        ...payload,
        created_by: currentUser.user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (error) {
      return { message: error.message, status: "error" };
    }

    savedQuizId = data.id;
  }

  if (savedQuizId) {
    await supabase.from("activity_logs").insert({
      action: values.quizId ? `Quiz modifié : ${values.title}` : `Quiz créé : ${values.title}`,
      entity_id: savedQuizId,
      entity_type: "quiz",
      user_id: currentUser.user.id,
    });
  }

  revalidatePath("/coach");
  revalidatePath("/coach/quizzes");
  revalidatePath("/coach/assignments/new");

  if (savedQuizId) {
    revalidatePath(`/coach/quizzes/${savedQuizId}/edit`);
    redirect(`/coach/quizzes/${savedQuizId}/edit`);
  }

  redirect("/coach/quizzes");
}

export async function addQuizQuestionAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = questionSchema.safeParse({
    correctOptions: formData.get("correctOptions") ?? "",
    explanation: formData.get("explanation") ?? "",
    options: formData.get("options") ?? "",
    points: formData.get("points"),
    questionText: formData.get("questionText"),
    questionType: formData.get("questionType"),
    quizId: formData.get("quizId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de la question sont invalides.",
      status: "error",
    };
  }

  const values = parsed.data;
  const writable = await ensureWritableQuiz(values.quizId, currentUser);

  if (writable.error) {
    return { message: writable.error, status: "error" };
  }

  const optionLines = parseOptionLines(values.options);
  const correctPositions = parseCorrectPositions(values.correctOptions);

  if (values.questionType !== "open" && optionLines.length < 2) {
    return {
      message: "Ajoute au moins deux options pour une question fermée.",
      status: "error",
    };
  }

  if (values.questionType === "single_choice" && correctPositions.length !== 1) {
    return {
      message: "Une question à choix unique doit avoir exactement une bonne réponse.",
      status: "error",
    };
  }

  if (values.questionType === "multiple_choice" && !correctPositions.length) {
    return {
      message: "Indique au moins une bonne réponse pour la question.",
      status: "error",
    };
  }

  if (
    correctPositions.some((position) => position > optionLines.length) &&
    values.questionType !== "open"
  ) {
    return {
      message: "Une bonne réponse pointe vers une option inexistante.",
      status: "error",
    };
  }

  const { data: existingQuestions, error: countError } = await writable.supabase
    .from("quiz_questions")
    .select("id")
    .eq("quiz_id", values.quizId);

  if (countError) {
    return { message: countError.message, status: "error" };
  }

  const { data: question, error: questionError } = await writable.supabase
    .from("quiz_questions")
    .insert({
      explanation: nullableText(values.explanation),
      points: values.points,
      position: (existingQuestions?.length ?? 0) + 1,
      question_text: values.questionText,
      question_type: values.questionType,
      quiz_id: values.quizId,
    })
    .select("id")
    .single<{ id: string }>();

  if (questionError) {
    return { message: questionError.message, status: "error" };
  }

  if (values.questionType !== "open") {
    const correctSet = new Set(correctPositions);
    const { error: optionError } = await writable.supabase
      .from("quiz_options")
      .insert(
        optionLines.map((option, index) => ({
          is_correct: correctSet.has(index + 1),
          option_text: option,
          position: index + 1,
          question_id: question.id,
        })),
      );

    if (optionError) {
      await writable.supabase.from("quiz_questions").delete().eq("id", question.id);

      return { message: optionError.message, status: "error" };
    }
  }

  await writable.supabase.from("activity_logs").insert({
    action: `Question ajoutée au quiz : ${writable.quiz?.title ?? "Quiz"}`,
    entity_id: values.quizId,
    entity_type: "quiz_question",
    user_id: currentUser.user.id,
  });

  revalidatePath("/coach/quizzes");
  revalidatePath(`/coach/quizzes/${values.quizId}/edit`);
  redirect(`/coach/quizzes/${values.quizId}/edit`);
}

export async function saveCorrectionAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = correctionSchema.safeParse({
    answerId: formData.get("answerId"),
    attemptId: formData.get("attemptId"),
    coachFeedback: formData.get("coachFeedback"),
    pointsObtained: formData.get("pointsObtained"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs de correction sont invalides.",
      status: "error",
    };
  }

  const values = parsed.data;
  const supabase = await createServerSupabaseClient();
  const { data: answer, error: answerError } = await supabase
    .from("quiz_answers")
    .select("id,attempt_id,question_id")
    .eq("id", values.answerId)
    .eq("attempt_id", values.attemptId)
    .maybeSingle<{ id: string; attempt_id: string; question_id: string }>();

  if (answerError) {
    return { message: answerError.message, status: "error" };
  }

  if (!answer) {
    return {
      message: "Réponse introuvable ou non autorisée.",
      status: "error",
    };
  }

  const { error } = await supabase
    .from("quiz_answers")
    .update({
      coach_feedback: nullableText(values.coachFeedback),
      corrected_at: new Date().toISOString(),
      corrected_by: currentUser.user.id,
      is_correct: values.pointsObtained > 0,
      needs_manual_correction: false,
      points_obtained: values.pointsObtained,
    })
    .eq("id", values.answerId);

  if (error) {
    return { message: error.message, status: "error" };
  }

  const { error: rpcError } = await supabase.rpc("recalculate_quiz_attempt", {
    target_attempt_id: values.attemptId,
  });

  if (rpcError) {
    return { message: rpcError.message, status: "error" };
  }

  await supabase.from("activity_logs").insert({
    action: "Réponse ouverte corrigée",
    entity_id: values.attemptId,
    entity_type: "quiz_attempt",
    user_id: currentUser.user.id,
  });

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id,percentage,status,user_id,quiz:quizzes(title)")
    .eq("id", values.attemptId)
    .maybeSingle<{
      id: string;
      percentage: number;
      quiz: { title: string } | null;
      status: string;
      user_id: string;
    }>();

  if (attempt && attempt.status !== "pending_correction") {
    await sendQuizCorrectionAvailableEmail({
      attemptId: attempt.id,
      coachId: currentUser.user.id,
      coacheeId: attempt.user_id,
      percentage: attempt.percentage,
      quizTitle: attempt.quiz?.title ?? "Quiz",
      status: attempt.status,
    });
  }

  revalidatePath("/coach");
  revalidatePath("/coach/corrections");
  revalidatePath("/coach/quiz-results");
  revalidatePath("/coach/coachees");

  return {
    message: "Correction enregistrée.",
    status: "success",
  };
}
