"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const requiredUuid = z.string().trim().regex(uuidPattern, "Identifiant invalide.");
const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || uuidPattern.test(value), {
    message: "Identifiant invalide.",
  });

const contentSchema = z.object({
  assignmentId: optionalUuid,
  contentId: requiredUuid,
});

const quizSchema = z.object({
  assignmentId: optionalUuid,
  quizId: requiredUuid,
});

export type CoacheeActionState = {
  message: string;
  status: "error" | "idle";
};

function formValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

async function findAssignmentForContent(
  contentId: string,
  assignmentId: string,
) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("assignments")
    .select("id,title,content_id,quiz_id")
    .eq("content_id", contentId);

  if (assignmentId) {
    query = query.eq("id", assignmentId);
  }

  const { data, error } = await query
    .order("deadline", { ascending: true })
    .limit(1)
    .maybeSingle<{
      content_id: string | null;
      id: string;
      quiz_id: string | null;
      title: string;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function findAssignmentForQuiz(quizId: string, assignmentId: string) {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("assignments")
    .select("id,title,content_id,quiz_id")
    .eq("quiz_id", quizId);

  if (assignmentId) {
    query = query.eq("id", assignmentId);
  }

  const { data, error } = await query
    .order("deadline", { ascending: true })
    .limit(1)
    .maybeSingle<{
      content_id: string | null;
      id: string;
      quiz_id: string | null;
      title: string;
    }>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function canUseQuizFromLearningPath(
  supabase: SupabaseServerClient,
  quizId: string,
) {
  const { data, error } = await supabase
    .from("learning_path_items")
    .select("id")
    .eq("quiz_id", quizId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
}

export async function completeContentAction(formData: FormData) {
  const currentUser = await requireRole(["admin", "coachee"]);
  const parsed = contentSchema.safeParse({
    assignmentId: formData.get("assignmentId") ?? "",
    contentId: formData.get("contentId"),
  });

  if (!parsed.success) {
    redirect("/coachee/tasks");
  }

  const { assignmentId, contentId } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const assignment = await findAssignmentForContent(contentId, assignmentId);
  const now = new Date().toISOString();

  await supabase.from("content_progress").upsert(
    {
      assignment_id: assignment?.id ?? null,
      completed_at: now,
      content_id: contentId,
      status: "completed",
      user_id: currentUser.user.id,
    },
    {
      onConflict: "content_id,user_id,assignment_id",
    },
  );

  if (assignment) {
    await supabase
      .from("assignment_progress")
      .update({
        completed_at: assignment.quiz_id ? null : now,
        started_at: now,
        status: assignment.quiz_id ? "in_progress" : "completed",
      })
      .eq("assignment_id", assignment.id)
      .eq("user_id", currentUser.user.id);
  }

  await supabase.from("activity_logs").insert({
    action: "Contenu terminé",
    entity_id: assignment?.id ?? contentId,
    entity_type: assignment ? "assignment" : "content",
    user_id: currentUser.user.id,
  });

  revalidatePath("/coachee");
  revalidatePath("/coachee/paths");
  revalidatePath("/coachee/tasks");
  revalidatePath(`/coachee/contents/${contentId}`);

  if (assignment?.quiz_id) {
    redirect(`/coachee/quiz/${assignment.quiz_id}?assignment=${assignment.id}`);
  }

  redirect("/coachee/tasks");
}

function getSelectedOptionIds(formData: FormData, questionId: string) {
  return formData
    .getAll(`selected:${questionId}`)
    .map((value) => String(value))
    .filter((value) => uuidPattern.test(value));
}

export async function submitQuizAction(
  _previousState: CoacheeActionState,
  formData: FormData,
): Promise<CoacheeActionState> {
  const currentUser = await requireRole(["admin", "coachee"]);
  const parsed = quizSchema.safeParse({
    assignmentId: formData.get("assignmentId") ?? "",
    quizId: formData.get("quizId"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Le quiz envoyé contient des champs invalides.",
      status: "error",
    };
  }

  const { assignmentId, quizId } = parsed.data;
  const supabase = await createServerSupabaseClient();
  const assignment = await findAssignmentForQuiz(quizId, assignmentId);
  let isLearningPathQuiz = false;

  if (!assignment) {
    try {
      isLearningPathQuiz = await canUseQuizFromLearningPath(supabase, quizId);
    } catch (error) {
      return {
        message:
          error instanceof Error
            ? error.message
            : "Impossible de vérifier l'accès au quiz.",
        status: "error",
      };
    }
  }

  if (!assignment && !isLearningPathQuiz) {
    return {
      message: "Ce quiz n'est pas assigné à votre compte.",
      status: "error",
    };
  }

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id,passing_score")
    .eq("id", quizId)
    .maybeSingle<{ id: string; passing_score: number }>();

  if (quizError) {
    return { message: quizError.message, status: "error" };
  }

  if (!quiz) {
    return { message: "Quiz introuvable.", status: "error" };
  }

  const { data: questions, error: questionError } = await supabase
    .from("quiz_questions")
    .select("id,question_type,points")
    .eq("quiz_id", quizId)
    .order("position", { ascending: true });

  if (questionError) {
    return { message: questionError.message, status: "error" };
  }

  if (!questions?.length) {
    return {
      message: "Ce quiz ne contient pas encore de question.",
      status: "error",
    };
  }

  const { data: options, error: optionError } = await supabase
    .from("quiz_options")
    .select("id,question_id,is_correct")
    .in(
      "question_id",
      questions.map((question) => question.id),
    );

  if (optionError) {
    return { message: optionError.message, status: "error" };
  }

  const optionsByQuestion = (options ?? []).reduce(
    (map, option) => {
      const bucket = map.get(option.question_id) ?? [];
      bucket.push(option);
      map.set(option.question_id, bucket);

      return map;
    },
    new Map<string, Array<{ id: string; is_correct: boolean; question_id: string }>>(),
  );
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      assignment_id: assignment?.id ?? null,
      quiz_id: quizId,
      submitted_at: new Date().toISOString(),
      user_id: currentUser.user.id,
    })
    .select("id")
    .single<{ id: string }>();

  if (attemptError) {
    return { message: attemptError.message, status: "error" };
  }

  const answers = questions.map((question) => {
    const questionOptions = optionsByQuestion.get(question.id) ?? [];
    const selectedOptionIds = getSelectedOptionIds(formData, question.id);
    const answerText = formValue(formData.get(`open:${question.id}`)).trim();
    const isOpen = question.question_type === "open";
    const correctOptionIds = questionOptions
      .filter((option) => option.is_correct)
      .map((option) => option.id)
      .toSorted();
    const selectedIds = selectedOptionIds
      .filter((id) => questionOptions.some((option) => option.id === id))
      .toSorted();
    const isCorrect =
      !isOpen &&
      selectedIds.length === correctOptionIds.length &&
      correctOptionIds.every((id, index) => id === selectedIds[index]);

    return {
      answer_text: isOpen ? answerText : null,
      attempt_id: attempt.id,
      is_correct: isOpen ? null : isCorrect,
      needs_manual_correction: isOpen,
      points_obtained: isCorrect ? Number(question.points) : 0,
      question_id: question.id,
      selected_option_ids: isOpen ? [] : selectedIds,
    };
  });

  const { error: answerError } = await supabase.from("quiz_answers").insert(answers);

  if (answerError) {
    await supabase.from("quiz_attempts").delete().eq("id", attempt.id);

    return { message: answerError.message, status: "error" };
  }

  const { error: rpcError } = await supabase.rpc("recalculate_quiz_attempt", {
    target_attempt_id: attempt.id,
  });

  if (rpcError) {
    return { message: rpcError.message, status: "error" };
  }

  const { data: savedAttempt } = await supabase
    .from("quiz_attempts")
    .select("status")
    .eq("id", attempt.id)
    .maybeSingle<{ status: "failed" | "passed" | "pending_correction" }>();

  if (assignment) {
    await supabase
      .from("assignment_progress")
      .update({
        completed_at:
          savedAttempt?.status === "pending_correction"
            ? null
            : new Date().toISOString(),
        started_at: new Date().toISOString(),
        status:
          savedAttempt?.status === "pending_correction"
            ? "in_progress"
            : "completed",
      })
      .eq("assignment_id", assignment.id)
      .eq("user_id", currentUser.user.id);
  }

  await supabase.from("activity_logs").insert({
    action: "Quiz soumis",
    entity_id: attempt.id,
    entity_type: "quiz_attempt",
    user_id: currentUser.user.id,
  });

  revalidatePath("/coachee");
  revalidatePath("/coachee/paths");
  revalidatePath("/coachee/tasks");
  revalidatePath("/coachee/results");
  revalidatePath("/coach/corrections");
  revalidatePath("/coach/quiz-results");

  redirect(`/coachee/results?attempt=${attempt.id}`);
}
