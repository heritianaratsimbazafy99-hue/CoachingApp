import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AssignmentStatus,
  ContentStatus,
  ContentType,
  QuizAttemptStatus,
} from "@/types/coaching";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type LearningPathRow = {
  cohort_id: string | null;
  created_at: string;
  created_by: string;
  description: string | null;
  id: string;
  title: string;
};

type LearningPathItemRow = {
  content_id: string | null;
  id: string;
  learning_path_id: string;
  position: number;
  quiz_id: string | null;
};

type CohortRow = {
  coach_id: string;
  description: string | null;
  id: string;
  name: string;
};

type ContentRow = {
  description: string | null;
  id: string;
  status: ContentStatus;
  title: string;
  type: ContentType;
};

type QuizRow = {
  description: string | null;
  id: string;
  title: string;
};

type ContentProgressRow = {
  completed_at: string | null;
  content_id: string;
  status: AssignmentStatus;
  updated_at: string;
};

type QuizAttemptRow = {
  created_at: string;
  id: string;
  passed: boolean;
  percentage: number;
  quiz_id: string;
  status: QuizAttemptStatus;
  submitted_at: string | null;
};

export type LearningPathItemKind = "content" | "quiz";

export type LearningPathItemProgress = {
  completedAt: string | null;
  isCompleted: boolean;
  label: string;
  percentage: number | null;
  status: "todo" | "completed" | "failed" | "passed" | "pending_correction";
  submittedAt: string | null;
};

export type LearningPathItemOption = {
  description: string;
  id: string;
  kind: LearningPathItemKind;
  label: string;
  meta: string;
  value: string;
};

export type LearningPathItem = {
  description: string;
  href: string;
  id: string;
  kind: LearningPathItemKind;
  label: string;
  position: number;
  progress?: LearningPathItemProgress;
  status?: ContentStatus;
  type?: ContentType;
};

export type LearningPathProgress = {
  completedCount: number;
  nextActionLabel: string;
  nextHref: string;
  nextLabel: string;
  percentage: number;
  totalCount: number;
};

export type CoachLearningPath = {
  cohortId: string;
  cohortName: string;
  createdAt: string;
  description: string;
  id: string;
  itemCount: number;
  items: LearningPathItem[];
  progress?: LearningPathProgress;
  title: string;
};

export type CoachLearningPathData = {
  cohorts: Array<{
    description: string;
    id: string;
    name: string;
  }>;
  itemOptions: LearningPathItemOption[];
  paths: CoachLearningPath[];
};

export type CoacheeLearningPathData = {
  metrics: {
    completedItemCount: number;
    contentCount: number;
    pathCount: number;
    quizCount: number;
    totalItemCount: number;
  };
  paths: CoachLearningPath[];
};

async function getRows<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as T[];
}

function ensureText(value: string | null | undefined, fallback = "") {
  return value?.trim() || fallback;
}

function itemValue(kind: LearningPathItemKind, id: string) {
  return `${kind}:${id}`;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce((map, item) => {
    const key = getKey(item);
    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);

    return map;
  }, new Map<string, T[]>());
}

function latestByDate<T>(
  items: T[] | undefined,
  getDate: (item: T) => string | null,
) {
  if (!items?.length) {
    return null;
  }

  return items.toSorted((first, second) => {
    const firstTime = new Date(getDate(first) ?? "").getTime() || 0;
    const secondTime = new Date(getDate(second) ?? "").getTime() || 0;

    return secondTime - firstTime;
  })[0];
}

function contentProgress(
  progressRows: ContentProgressRow[] | undefined,
): LearningPathItemProgress {
  const completed = latestByDate(
    progressRows?.filter((progress) => progress.status === "completed"),
    (progress) => progress.completed_at ?? progress.updated_at,
  );

  if (completed) {
    return {
      completedAt: completed.completed_at,
      isCompleted: true,
      label: "Terminé",
      percentage: null,
      status: "completed",
      submittedAt: null,
    };
  }

  return {
    completedAt: null,
    isCompleted: false,
    label: "À lire",
    percentage: null,
    status: "todo",
    submittedAt: null,
  };
}

function quizProgress(
  attempts: QuizAttemptRow[] | undefined,
): LearningPathItemProgress {
  const latestAttempt = latestByDate(
    attempts,
    (attempt) => attempt.submitted_at ?? attempt.created_at,
  );

  if (!latestAttempt) {
    return {
      completedAt: null,
      isCompleted: false,
      label: "À faire",
      percentage: null,
      status: "todo",
      submittedAt: null,
    };
  }

  const isCompleted =
    latestAttempt.status === "passed" ||
    latestAttempt.status === "pending_correction";
  const labelByStatus: Record<QuizAttemptStatus, string> = {
    failed: "À reprendre",
    passed: "Réussi",
    pending_correction: "En correction",
  };

  return {
    completedAt: isCompleted
      ? latestAttempt.submitted_at ?? latestAttempt.created_at
      : null,
    isCompleted,
    label: labelByStatus[latestAttempt.status],
    percentage: Number(latestAttempt.percentage),
    status: latestAttempt.status,
    submittedAt: latestAttempt.submitted_at ?? latestAttempt.created_at,
  };
}

function pathProgress(items: LearningPathItem[]): LearningPathProgress | undefined {
  const trackedItems = items.filter((item) => item.progress);

  if (!trackedItems.length) {
    return undefined;
  }

  const completedCount = trackedItems.filter(
    (item) => item.progress?.isCompleted,
  ).length;
  const nextItem = trackedItems.find((item) => !item.progress?.isCompleted);
  const isComplete = completedCount === trackedItems.length;

  return {
    completedCount,
    nextActionLabel: isComplete ? "Revoir" : "Continuer",
    nextHref: nextItem?.href ?? trackedItems[0]?.href ?? "/coachee/paths",
    nextLabel: nextItem?.label ?? "Parcours terminé",
    percentage: Math.round((completedCount / trackedItems.length) * 100),
    totalCount: trackedItems.length,
  };
}

function getPathItems(
  path: LearningPathRow,
  items: LearningPathItemRow[],
  contentsById: Map<string, ContentRow>,
  quizzesById: Map<string, QuizRow>,
  progressMaps?: {
    contentProgressByContentId: Map<string, ContentProgressRow[]>;
    quizAttemptsByQuizId: Map<string, QuizAttemptRow[]>;
  },
): LearningPathItem[] {
  return items
    .filter((item) => item.learning_path_id === path.id)
    .toSorted((first, second) => first.position - second.position)
    .map((item) => {
      if (item.content_id) {
        const content = contentsById.get(item.content_id);

        return {
          description: ensureText(content?.description, "Contenu du parcours."),
          href: `/coachee/contents/${item.content_id}`,
          id: item.id,
          kind: "content" as const,
          label: content?.title ?? "Contenu indisponible",
          position: item.position,
          progress: progressMaps
            ? contentProgress(
                progressMaps.contentProgressByContentId.get(item.content_id),
              )
            : undefined,
          status: content?.status,
          type: content?.type,
        };
      }

      const quizId = item.quiz_id ?? "";
      const quiz = quizzesById.get(quizId);

      return {
        description: ensureText(quiz?.description, "Quiz du parcours."),
        href: `/coachee/quiz/${quizId}`,
        id: item.id,
        kind: "quiz" as const,
        label: quiz?.title ?? "Quiz indisponible",
        position: item.position,
        progress: progressMaps
          ? quizProgress(progressMaps.quizAttemptsByQuizId.get(quizId))
          : undefined,
      };
    });
}

async function fetchPathItems(
  supabase: SupabaseServerClient,
  pathIds: string[],
) {
  if (!pathIds.length) {
    return [];
  }

  return getRows<LearningPathItemRow>(
    supabase
      .from("learning_path_items")
      .select("id,learning_path_id,content_id,quiz_id,position")
      .in("learning_path_id", pathIds)
      .order("position", { ascending: true }),
  );
}

async function fetchContents(
  supabase: SupabaseServerClient,
  contentIds?: string[],
  currentUserId?: string,
) {
  let query = supabase
    .from("contents")
    .select("id,title,description,type,status")
    .order("title", { ascending: true });

  if (contentIds) {
    if (!contentIds.length) {
      return [];
    }

    query = query.in("id", contentIds);
  }

  if (currentUserId) {
    query = query.eq("created_by", currentUserId);
  }

  return getRows<ContentRow>(query);
}

async function fetchQuizzes(
  supabase: SupabaseServerClient,
  quizIds?: string[],
  currentUserId?: string,
) {
  let query = supabase
    .from("quizzes")
    .select("id,title,description")
    .order("title", { ascending: true });

  if (quizIds) {
    if (!quizIds.length) {
      return [];
    }

    query = query.in("id", quizIds);
  }

  if (currentUserId) {
    query = query.eq("created_by", currentUserId);
  }

  return getRows<QuizRow>(query);
}

async function fetchContentProgress(
  supabase: SupabaseServerClient,
  userId: string,
  contentIds: string[],
) {
  if (!contentIds.length) {
    return [];
  }

  return getRows<ContentProgressRow>(
    supabase
      .from("content_progress")
      .select("content_id,status,completed_at,updated_at")
      .eq("user_id", userId)
      .in("content_id", contentIds)
      .order("updated_at", { ascending: false }),
  );
}

async function fetchQuizAttempts(
  supabase: SupabaseServerClient,
  userId: string,
  quizIds: string[],
) {
  if (!quizIds.length) {
    return [];
  }

  return getRows<QuizAttemptRow>(
    supabase
      .from("quiz_attempts")
      .select("id,quiz_id,percentage,status,passed,submitted_at,created_at")
      .eq("user_id", userId)
      .in("quiz_id", quizIds)
      .order("created_at", { ascending: false }),
  );
}

function buildPaths(
  paths: LearningPathRow[],
  items: LearningPathItemRow[],
  cohortsById: Map<string, CohortRow>,
  contentsById: Map<string, ContentRow>,
  quizzesById: Map<string, QuizRow>,
  progressMaps?: {
    contentProgressByContentId: Map<string, ContentProgressRow[]>;
    quizAttemptsByQuizId: Map<string, QuizAttemptRow[]>;
  },
): CoachLearningPath[] {
  return paths.map((path) => {
    const pathItems = getPathItems(
      path,
      items,
      contentsById,
      quizzesById,
      progressMaps,
    );
    const cohort = path.cohort_id ? cohortsById.get(path.cohort_id) : null;

    return {
      cohortId: path.cohort_id ?? "",
      cohortName: cohort?.name ?? "Cohorte indisponible",
      createdAt: path.created_at,
      description: ensureText(path.description, "Parcours sans description."),
      id: path.id,
      itemCount: pathItems.length,
      items: pathItems,
      progress: pathProgress(pathItems),
      title: path.title,
    };
  });
}

export const getCoachLearningPathData = cache(
  async (): Promise<CoachLearningPathData> => {
    const currentUser = await requireRole(["admin", "coach"]);
    const supabase = await createServerSupabaseClient();
    const isAdmin = currentUser.role === "admin";

    let pathsQuery = supabase
      .from("learning_paths")
      .select("id,title,description,cohort_id,created_by,created_at")
      .order("created_at", { ascending: false });
    let cohortsQuery = supabase
      .from("cohorts")
      .select("id,name,description,coach_id")
      .order("name", { ascending: true });

    if (!isAdmin) {
      pathsQuery = pathsQuery.eq("created_by", currentUser.user.id);
      cohortsQuery = cohortsQuery.eq("coach_id", currentUser.user.id);
    }

    const [paths, cohorts, contents, quizzes] = await Promise.all([
      getRows<LearningPathRow>(pathsQuery),
      getRows<CohortRow>(cohortsQuery),
      fetchContents(supabase, undefined, isAdmin ? undefined : currentUser.user.id),
      fetchQuizzes(supabase, undefined, isAdmin ? undefined : currentUser.user.id),
    ]);
    const items = await fetchPathItems(
      supabase,
      paths.map((path) => path.id),
    );
    const cohortsById = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
    const contentsById = new Map(contents.map((content) => [content.id, content]));
    const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));

    return {
      cohorts: cohorts.map((cohort) => ({
        description: ensureText(cohort.description, "Aucune description"),
        id: cohort.id,
        name: cohort.name,
      })),
      itemOptions: [
        ...contents.map((content) => ({
          description: ensureText(content.description, "Contenu sans description."),
          id: content.id,
          kind: "content" as const,
          label: content.title,
          meta: `${content.type} · ${content.status}`,
          value: itemValue("content", content.id),
        })),
        ...quizzes.map((quiz) => ({
          description: ensureText(quiz.description, "Quiz sans description."),
          id: quiz.id,
          kind: "quiz" as const,
          label: quiz.title,
          meta: "Quiz",
          value: itemValue("quiz", quiz.id),
        })),
      ],
      paths: buildPaths(paths, items, cohortsById, contentsById, quizzesById),
    };
  },
);

export const getCoacheeLearningPathData = cache(
  async (): Promise<CoacheeLearningPathData> => {
    const currentUser = await requireRole(["admin", "coachee"]);
    const supabase = await createServerSupabaseClient();
    const paths = await getRows<LearningPathRow>(
      supabase
        .from("learning_paths")
        .select("id,title,description,cohort_id,created_by,created_at")
        .order("created_at", { ascending: false }),
    );
    const items = await fetchPathItems(
      supabase,
      paths.map((path) => path.id),
    );
    const contentIds = items
      .map((item) => item.content_id)
      .filter(Boolean) as string[];
    const quizIds = items.map((item) => item.quiz_id).filter(Boolean) as string[];
    const cohortIds = paths
      .map((path) => path.cohort_id)
      .filter(Boolean) as string[];
    const [contents, quizzes, cohorts, contentProgressRows, quizAttempts] =
      await Promise.all([
        fetchContents(supabase, contentIds),
        fetchQuizzes(supabase, quizIds),
        cohortIds.length
          ? getRows<CohortRow>(
              supabase
                .from("cohorts")
                .select("id,name,description,coach_id")
                .in("id", cohortIds),
            )
          : [],
        fetchContentProgress(supabase, currentUser.user.id, contentIds),
        fetchQuizAttempts(supabase, currentUser.user.id, quizIds),
      ]);
    const contentsById = new Map(contents.map((content) => [content.id, content]));
    const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const cohortsById = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
    const contentProgressByContentId = groupBy(
      contentProgressRows,
      (progress) => progress.content_id,
    );
    const quizAttemptsByQuizId = groupBy(
      quizAttempts,
      (attempt) => attempt.quiz_id,
    );
    const mappedPaths = buildPaths(
      paths,
      items,
      cohortsById,
      contentsById,
      quizzesById,
      {
        contentProgressByContentId,
        quizAttemptsByQuizId,
      },
    );
    const completedItemCount = mappedPaths.reduce(
      (sum, path) => sum + (path.progress?.completedCount ?? 0),
      0,
    );

    return {
      metrics: {
        completedItemCount,
        contentCount: items.filter((item) => item.content_id).length,
        pathCount: mappedPaths.length,
        quizCount: items.filter((item) => item.quiz_id).length,
        totalItemCount: items.length,
      },
      paths: mappedPaths,
    };
  },
);
