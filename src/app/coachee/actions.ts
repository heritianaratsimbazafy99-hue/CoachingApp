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

type LearningPathResourceKind = "content" | "quiz";

type LearningPathContext = {
  cohortId: string | null;
  itemId: string;
  pathId: string;
  pathTitle: string;
  position: number;
  resourceTitle: string;
};

type LearningPathProgressSnapshot = {
  activeCount: number;
  completedCount: number;
  totalCount: number;
};

function formValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function latestByDate<T>(
  items: T[],
  getDate: (item: T) => string | null,
) {
  if (!items.length) {
    return null;
  }

  return items.toSorted((first, second) => {
    const firstTime = new Date(getDate(first) ?? "").getTime() || 0;
    const secondTime = new Date(getDate(second) ?? "").getTime() || 0;

    return secondTime - firstTime;
  })[0];
}

async function getResourceTitle(
  supabase: SupabaseServerClient,
  kind: LearningPathResourceKind,
  resourceId: string,
) {
  if (kind === "content") {
    const { data, error } = await supabase
      .from("contents")
      .select("title")
      .eq("id", resourceId)
      .maybeSingle<{ title: string }>();

    if (error) {
      throw new Error(error.message);
    }

    return data?.title ?? "Contenu du parcours";
  }

  const { data, error } = await supabase
    .from("quizzes")
    .select("title")
    .eq("id", resourceId)
    .maybeSingle<{ title: string }>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.title ?? "Quiz du parcours";
}

async function findLearningPathContexts(
  supabase: SupabaseServerClient,
  kind: LearningPathResourceKind,
  resourceId: string,
): Promise<LearningPathContext[]> {
  const resourceColumn = kind === "content" ? "content_id" : "quiz_id";
  const [{ data: items, error: itemError }, resourceTitle] = await Promise.all([
    supabase
      .from("learning_path_items")
      .select("id,learning_path_id,position")
      .eq(resourceColumn, resourceId),
    getResourceTitle(supabase, kind, resourceId),
  ]);

  if (itemError) {
    throw new Error(itemError.message);
  }

  const pathIds = uniqueStrings(
    (items ?? []).map((item) => item.learning_path_id),
  );

  if (!pathIds.length) {
    return [];
  }

  const { data: paths, error: pathError } = await supabase
    .from("learning_paths")
    .select("id,title,cohort_id")
    .in("id", pathIds);

  if (pathError) {
    throw new Error(pathError.message);
  }

  const pathsById = new Map(
    (paths ?? []).map((path) => [
      path.id,
      {
        cohortId: path.cohort_id,
        title: path.title,
      },
    ]),
  );

  return (items ?? [])
    .map((item) => {
      const path = pathsById.get(item.learning_path_id);

      if (!path) {
        return null;
      }

      return {
        cohortId: path.cohortId,
        itemId: item.id,
        pathId: item.learning_path_id,
        pathTitle: path.title,
        position: item.position,
        resourceTitle,
      };
    })
    .filter(Boolean) as LearningPathContext[];
}

async function getLearningPathProgressSnapshots(
  supabase: SupabaseServerClient,
  pathIds: string[],
  userId: string,
) {
  const uniquePathIds = uniqueStrings(pathIds);

  if (!uniquePathIds.length) {
    return new Map<string, LearningPathProgressSnapshot>();
  }

  const { data: items, error: itemError } = await supabase
    .from("learning_path_items")
    .select("learning_path_id,content_id,quiz_id")
    .in("learning_path_id", uniquePathIds);

  if (itemError) {
    throw new Error(itemError.message);
  }

  const pathItems = items ?? [];
  const contentIds = uniqueStrings(pathItems.map((item) => item.content_id));
  const quizIds = uniqueStrings(pathItems.map((item) => item.quiz_id));
  const [contentProgressResponse, quizAttemptsResponse] = await Promise.all([
    contentIds.length
      ? supabase
          .from("content_progress")
          .select("content_id,status,completed_at,created_at")
          .eq("user_id", userId)
          .in("content_id", contentIds)
      : Promise.resolve({ data: [], error: null }),
    quizIds.length
      ? supabase
          .from("quiz_attempts")
          .select("quiz_id,status,submitted_at,created_at")
          .eq("user_id", userId)
          .in("quiz_id", quizIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (contentProgressResponse.error) {
    throw new Error(contentProgressResponse.error.message);
  }

  if (quizAttemptsResponse.error) {
    throw new Error(quizAttemptsResponse.error.message);
  }

  const contentProgressById = new Map<string, typeof contentProgressResponse.data>();
  const quizAttemptsById = new Map<string, typeof quizAttemptsResponse.data>();

  (contentProgressResponse.data ?? []).forEach((progress) => {
    const bucket = contentProgressById.get(progress.content_id) ?? [];
    bucket.push(progress);
    contentProgressById.set(progress.content_id, bucket);
  });

  (quizAttemptsResponse.data ?? []).forEach((attempt) => {
    const bucket = quizAttemptsById.get(attempt.quiz_id) ?? [];
    bucket.push(attempt);
    quizAttemptsById.set(attempt.quiz_id, bucket);
  });

  return uniquePathIds.reduce((snapshots, pathId) => {
    const currentItems = pathItems.filter((item) => item.learning_path_id === pathId);
    const snapshot = currentItems.reduce<LearningPathProgressSnapshot>(
      (progress, item) => {
        if (item.content_id) {
          const contentProgress = contentProgressById.get(item.content_id) ?? [];
          const isCompleted = contentProgress.some(
            (row) => row.status === "completed",
          );

          return {
            activeCount: progress.activeCount + (contentProgress.length ? 1 : 0),
            completedCount: progress.completedCount + (isCompleted ? 1 : 0),
            totalCount: progress.totalCount + 1,
          };
        }

        if (item.quiz_id) {
          const latestAttempt = latestByDate(
            quizAttemptsById.get(item.quiz_id) ?? [],
            (attempt) => attempt.submitted_at ?? attempt.created_at,
          );
          const isCompleted =
            latestAttempt?.status === "passed" ||
            latestAttempt?.status === "pending_correction";

          return {
            activeCount: progress.activeCount + (latestAttempt ? 1 : 0),
            completedCount: progress.completedCount + (isCompleted ? 1 : 0),
            totalCount: progress.totalCount + 1,
          };
        }

        return progress;
      },
      {
        activeCount: 0,
        completedCount: 0,
        totalCount: 0,
      },
    );

    snapshots.set(pathId, snapshot);

    return snapshots;
  }, new Map<string, LearningPathProgressSnapshot>());
}

async function logLearningPathActivity(
  supabase: SupabaseServerClient,
  payload: {
    beforeSnapshots: Map<string, LearningPathProgressSnapshot>;
    contexts: LearningPathContext[];
    event: "path_content_completed" | "path_quiz_submitted";
    quizStatus?: string;
    userId: string;
  },
) {
  if (!payload.contexts.length) {
    return;
  }

  const afterSnapshots = await getLearningPathProgressSnapshots(
    supabase,
    payload.contexts.map((context) => context.pathId),
    payload.userId,
  );
  const logs = payload.contexts.flatMap((context) => {
    const before = payload.beforeSnapshots.get(context.pathId) ?? {
      activeCount: 0,
      completedCount: 0,
      totalCount: 0,
    };
    const after = afterSnapshots.get(context.pathId) ?? before;
    const progressPercentage = after.totalCount
      ? Math.round((after.completedCount / after.totalCount) * 100)
      : 0;
    const metadata: Record<string, unknown> = {
      cohortId: context.cohortId,
      completedCount: after.completedCount,
      event: payload.event,
      learningPathId: context.pathId,
      learningPathItemId: context.itemId,
      learningPathTitle: context.pathTitle,
      position: context.position,
      progressPercentage,
      quizStatus: payload.quizStatus ?? null,
      resourceTitle: context.resourceTitle,
      totalCount: after.totalCount,
    };
    const itemAction =
      payload.event === "path_content_completed"
        ? `Contenu de parcours terminé : ${context.resourceTitle}`
        : `Quiz de parcours soumis : ${context.resourceTitle}`;
    const rows = [
      {
        action: itemAction,
        entity_id: context.itemId,
        entity_type: "learning_path_item",
        metadata,
        user_id: payload.userId,
      },
    ];

    if (before.activeCount === 0 && after.activeCount > 0) {
      rows.push({
        action: `Parcours démarré : ${context.pathTitle}`,
        entity_id: context.pathId,
        entity_type: "learning_path",
        metadata: {
          ...metadata,
          event: "path_started",
        },
        user_id: payload.userId,
      });
    }

    if (
      after.totalCount > 0 &&
      before.completedCount < after.totalCount &&
      after.completedCount === after.totalCount
    ) {
      rows.push({
        action: `Parcours terminé : ${context.pathTitle}`,
        entity_id: context.pathId,
        entity_type: "learning_path",
        metadata: {
          ...metadata,
          event: "path_completed",
        },
        user_id: payload.userId,
      });
    }

    return rows;
  });

  const { error } = await supabase.from("activity_logs").insert(logs);

  if (error) {
    console.error("Learning path activity log failed:", error.message);
  }
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

async function saveContentProgress(
  supabase: SupabaseServerClient,
  payload: {
    assignmentId: string | null;
    completedAt: string;
    contentId: string;
    userId: string;
  },
) {
  if (payload.assignmentId) {
    const { error } = await supabase.from("content_progress").upsert(
      {
        assignment_id: payload.assignmentId,
        completed_at: payload.completedAt,
        content_id: payload.contentId,
        status: "completed",
        user_id: payload.userId,
      },
      {
        onConflict: "content_id,user_id,assignment_id",
      },
    );

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { data: existingProgress, error: existingError } = await supabase
    .from("content_progress")
    .select("id")
    .eq("content_id", payload.contentId)
    .eq("user_id", payload.userId)
    .is("assignment_id", null)
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (existingProgress) {
    const { error } = await supabase
      .from("content_progress")
      .update({
        completed_at: payload.completedAt,
        status: "completed",
      })
      .eq("id", existingProgress.id);

    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const { error } = await supabase.from("content_progress").insert({
    assignment_id: null,
    completed_at: payload.completedAt,
    content_id: payload.contentId,
    status: "completed",
    user_id: payload.userId,
  });

  if (error) {
    throw new Error(error.message);
  }
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
  const learningPathContexts = await findLearningPathContexts(
    supabase,
    "content",
    contentId,
  );
  const learningPathProgressBefore = await getLearningPathProgressSnapshots(
    supabase,
    learningPathContexts.map((context) => context.pathId),
    currentUser.user.id,
  );

  try {
    await saveContentProgress(supabase, {
      assignmentId: assignment?.id ?? null,
      completedAt: now,
      contentId,
      userId: currentUser.user.id,
    });
  } catch {
    redirect(`/coachee/contents/${contentId}`);
  }

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

  await logLearningPathActivity(supabase, {
    beforeSnapshots: learningPathProgressBefore,
    contexts: learningPathContexts,
    event: "path_content_completed",
    userId: currentUser.user.id,
  });

  revalidatePath("/coach");
  revalidatePath("/coach/paths");
  revalidatePath("/coachee");
  revalidatePath("/coachee/paths");
  revalidatePath("/coachee/tasks");
  revalidatePath(`/coachee/contents/${contentId}`);

  if (assignment?.quiz_id) {
    redirect(`/coachee/quiz/${assignment.quiz_id}?assignment=${assignment.id}`);
  }

  if (!assignment) {
    redirect("/coachee/paths");
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
    .select("id,passing_score,title")
    .eq("id", quizId)
    .maybeSingle<{ id: string; passing_score: number; title: string }>();

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

  const learningPathContexts = await findLearningPathContexts(
    supabase,
    "quiz",
    quizId,
  );
  const learningPathProgressBefore = await getLearningPathProgressSnapshots(
    supabase,
    learningPathContexts.map((context) => context.pathId),
    currentUser.user.id,
  );

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

  await logLearningPathActivity(supabase, {
    beforeSnapshots: learningPathProgressBefore,
    contexts: learningPathContexts,
    event: "path_quiz_submitted",
    quizStatus: savedAttempt?.status,
    userId: currentUser.user.id,
  });

  revalidatePath("/coach");
  revalidatePath("/coach/paths");
  revalidatePath("/coachee");
  revalidatePath("/coachee/paths");
  revalidatePath("/coachee/tasks");
  revalidatePath("/coachee/results");
  revalidatePath("/coach/corrections");
  revalidatePath("/coach/quiz-results");

  redirect(`/coachee/results?attempt=${attempt.id}`);
}
