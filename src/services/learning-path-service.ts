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
  user_id: string;
};

type QuizAttemptRow = {
  created_at: string;
  id: string;
  passed: boolean;
  percentage: number;
  quiz_id: string;
  status: QuizAttemptStatus;
  submitted_at: string | null;
  user_id: string;
};

type CohortMemberRow = {
  cohort_id: string;
  user_id: string;
};

type ProfileRow = {
  avatar_url: string | null;
  full_name: string;
  user_id: string;
};

type ActivityLogRow = {
  action: string;
  created_at: string;
  entity_id: string | null;
  entity_type: string;
  id: string;
  metadata: Record<string, unknown> | null;
  user_id: string;
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

export type CoachLearningPathLearnerProgress = {
  avatarUrl: string;
  completedCount: number;
  failedQuizCount: number;
  fullName: string;
  lastActivityAt: string | null;
  nextLabel: string;
  pendingCorrectionCount: number;
  percentage: number;
  status: "not_started" | "in_progress" | "completed" | "blocked";
  totalCount: number;
  userId: string;
};

export type CoachLearningPathSummary = {
  averageProgress: number;
  blockedLearnersCount: number;
  completedLearnersCount: number;
  inProgressLearnersCount: number;
  learnerCount: number;
};

export type CoachLearningPath = {
  cohortId: string;
  cohortName: string;
  coachSummary?: CoachLearningPathSummary;
  createdAt: string;
  description: string;
  id: string;
  itemCount: number;
  items: LearningPathItem[];
  learnerProgress?: CoachLearningPathLearnerProgress[];
  progress?: LearningPathProgress;
  title: string;
};

export type CoachLearningPathRecentEvent = {
  action: string;
  coacheeId: string;
  coacheeName: string;
  createdAt: string;
  detail: string;
  href: string;
  id: string;
  pathTitle: string;
};

export type CoachLearningPathAttentionItem = {
  coacheeId: string;
  coacheeName: string;
  cohortName: string;
  href: string;
  id: string;
  lastActivityAt: string | null;
  pathTitle: string;
  percentage: number;
  reason: string;
};

export type CoachLearningPathData = {
  cohorts: Array<{
    description: string;
    id: string;
    name: string;
  }>;
  itemOptions: LearningPathItemOption[];
  metrics: {
    averageProgress: number;
    blockedLearnersCount: number;
    learnerCount: number;
    pathCount: number;
  };
  paths: CoachLearningPath[];
  signals: {
    blockedLearners: CoachLearningPathAttentionItem[];
    pendingCorrections: CoachLearningPathAttentionItem[];
    recentEvents: CoachLearningPathRecentEvent[];
  };
};

export type CoachLearningPathEditorData = {
  cohorts: CoachLearningPathData["cohorts"];
  itemOptions: LearningPathItemOption[];
  path: {
    cohortId: string;
    description: string;
    id: string;
    items: string[];
    title: string;
  };
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

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
}

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + Number(value ?? 0), 0) / values.length,
  );
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

function progressKey(userId: string, resourceId: string) {
  return `${userId}:${resourceId}`;
}

function lastActivity(items: LearningPathItem[]) {
  const timestamps = items
    .map((item) => item.progress?.submittedAt ?? item.progress?.completedAt)
    .filter(Boolean) as string[];

  if (!timestamps.length) {
    return null;
  }

  return timestamps.toSorted(
    (first, second) => new Date(second).getTime() - new Date(first).getTime(),
  )[0];
}

function getLearnerStatus(
  progress: LearningPathProgress | undefined,
  items: LearningPathItem[],
): CoachLearningPathLearnerProgress["status"] {
  if (items.some((item) => item.progress?.status === "failed")) {
    return "blocked";
  }

  if (!progress || progress.percentage === 0) {
    return "not_started";
  }

  if (progress.percentage === 100) {
    return "completed";
  }

  return "in_progress";
}

function getLearnerProgress(
  path: LearningPathRow,
  items: LearningPathItemRow[],
  contentsById: Map<string, ContentRow>,
  quizzesById: Map<string, QuizRow>,
  profileByUserId: Map<string, ProfileRow>,
  contentProgressByUserAndContentId: Map<string, ContentProgressRow[]>,
  quizAttemptsByUserAndQuizId: Map<string, QuizAttemptRow[]>,
  member: CohortMemberRow,
): CoachLearningPathLearnerProgress {
  const contentProgressByContentId = new Map<string, ContentProgressRow[]>();
  const quizAttemptsByQuizId = new Map<string, QuizAttemptRow[]>();
  const pathItemRows = items.filter((item) => item.learning_path_id === path.id);

  pathItemRows.forEach((item) => {
    if (item.content_id) {
      contentProgressByContentId.set(
        item.content_id,
        contentProgressByUserAndContentId.get(
          progressKey(member.user_id, item.content_id),
        ) ?? [],
      );
    }

    if (item.quiz_id) {
      quizAttemptsByQuizId.set(
        item.quiz_id,
        quizAttemptsByUserAndQuizId.get(progressKey(member.user_id, item.quiz_id)) ??
          [],
      );
    }
  });

  const learnerItems = getPathItems(path, pathItemRows, contentsById, quizzesById, {
    contentProgressByContentId,
    quizAttemptsByQuizId,
  });
  const progress = pathProgress(learnerItems);
  const profile = profileByUserId.get(member.user_id);

  return {
    avatarUrl: profile?.avatar_url ?? "",
    completedCount: progress?.completedCount ?? 0,
    failedQuizCount: learnerItems.filter(
      (item) => item.progress?.status === "failed",
    ).length,
    fullName: profile?.full_name ?? "Coaché",
    lastActivityAt: lastActivity(learnerItems),
    nextLabel: progress?.nextLabel ?? "Aucune étape",
    pendingCorrectionCount: learnerItems.filter(
      (item) => item.progress?.status === "pending_correction",
    ).length,
    percentage: progress?.percentage ?? 0,
    status: getLearnerStatus(progress, learnerItems),
    totalCount: progress?.totalCount ?? learnerItems.length,
    userId: member.user_id,
  };
}

function coachSummary(
  learnerProgress: CoachLearningPathLearnerProgress[],
): CoachLearningPathSummary {
  return {
    averageProgress: average(learnerProgress.map((learner) => learner.percentage)),
    blockedLearnersCount: learnerProgress.filter(
      (learner) => learner.status === "blocked",
    ).length,
    completedLearnersCount: learnerProgress.filter(
      (learner) => learner.status === "completed",
    ).length,
    inProgressLearnersCount: learnerProgress.filter(
      (learner) => learner.status === "in_progress",
    ).length,
    learnerCount: learnerProgress.length,
  };
}

function getCoachLearningPathMetrics(paths: CoachLearningPath[]) {
  const learnerProgress = paths.flatMap((path) => path.learnerProgress ?? []);

  return {
    averageProgress: average(learnerProgress.map((learner) => learner.percentage)),
    blockedLearnersCount: learnerProgress.filter(
      (learner) => learner.status === "blocked",
    ).length,
    learnerCount: new Set(learnerProgress.map((learner) => learner.userId)).size,
    pathCount: paths.length,
  };
}

function metadataText(
  metadata: Record<string, unknown> | null,
  key: string,
  fallback = "",
) {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value : fallback;
}

function getCoachLearningPathSignals(
  paths: CoachLearningPath[],
  activityLogs: ActivityLogRow[],
  profileByUserId: Map<string, ProfileRow>,
) {
  const recentEvents = activityLogs.map((activity) => {
    const profile = profileByUserId.get(activity.user_id);
    const pathTitle = metadataText(
      activity.metadata,
      "learningPathTitle",
      "Parcours",
    );
    const resourceTitle = metadataText(activity.metadata, "resourceTitle");

    return {
      action: activity.action,
      coacheeId: activity.user_id,
      coacheeName: profile?.full_name ?? "Coaché",
      createdAt: activity.created_at,
      detail: resourceTitle || pathTitle,
      href: `/coach/coachees/${activity.user_id}`,
      id: activity.id,
      pathTitle,
    };
  });
  const blockedLearners = paths
    .flatMap((path) =>
      (path.learnerProgress ?? [])
        .filter((learner) => learner.status === "blocked")
        .map((learner) => ({
          coacheeId: learner.userId,
          coacheeName: learner.fullName,
          cohortName: path.cohortName,
          href: `/coach/coachees/${learner.userId}`,
          id: `${path.id}:${learner.userId}:blocked`,
          lastActivityAt: learner.lastActivityAt,
          pathTitle: path.title,
          percentage: learner.percentage,
          reason: `${learner.failedQuizCount} quiz à reprendre`,
        })),
    )
    .toSorted((first, second) => first.percentage - second.percentage)
    .slice(0, 5);
  const pendingCorrections = paths
    .flatMap((path) =>
      (path.learnerProgress ?? [])
        .filter((learner) => learner.pendingCorrectionCount > 0)
        .map((learner) => ({
          coacheeId: learner.userId,
          coacheeName: learner.fullName,
          cohortName: path.cohortName,
          href: "/coach/corrections",
          id: `${path.id}:${learner.userId}:correction`,
          lastActivityAt: learner.lastActivityAt,
          pathTitle: path.title,
          percentage: learner.percentage,
          reason: `${learner.pendingCorrectionCount} correction en attente`,
        })),
    )
    .toSorted((first, second) => {
      const firstTime = new Date(first.lastActivityAt ?? "").getTime() || 0;
      const secondTime = new Date(second.lastActivityAt ?? "").getTime() || 0;

      return secondTime - firstTime;
    })
    .slice(0, 5);

  return {
    blockedLearners,
    pendingCorrections,
    recentEvents,
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

function getItemOptions(contents: ContentRow[], quizzes: QuizRow[]) {
  return [
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
  ];
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
      .select("content_id,user_id,status,completed_at,updated_at")
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
      .select("id,quiz_id,user_id,percentage,status,passed,submitted_at,created_at")
      .eq("user_id", userId)
      .in("quiz_id", quizIds)
      .order("created_at", { ascending: false }),
  );
}

async function fetchCohortMembers(
  supabase: SupabaseServerClient,
  cohortIds: string[],
) {
  if (!cohortIds.length) {
    return [];
  }

  return getRows<CohortMemberRow>(
    supabase
      .from("cohort_members")
      .select("cohort_id,user_id")
      .in("cohort_id", cohortIds),
  );
}

async function fetchProfiles(supabase: SupabaseServerClient, userIds: string[]) {
  if (!userIds.length) {
    return [];
  }

  return getRows<ProfileRow>(
    supabase
      .from("profiles")
      .select("user_id,full_name,avatar_url")
      .in("user_id", userIds)
      .order("full_name", { ascending: true }),
  );
}

async function fetchLearningPathActivityLogs(
  supabase: SupabaseServerClient,
  userIds: string[],
) {
  if (!userIds.length) {
    return [];
  }

  return getRows<ActivityLogRow>(
    supabase
      .from("activity_logs")
      .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
      .in("user_id", userIds)
      .in("entity_type", ["learning_path", "learning_path_item"])
      .order("created_at", { ascending: false })
      .limit(8),
  );
}

async function fetchContentProgressForUsers(
  supabase: SupabaseServerClient,
  userIds: string[],
  contentIds: string[],
) {
  if (!userIds.length || !contentIds.length) {
    return [];
  }

  return getRows<ContentProgressRow>(
    supabase
      .from("content_progress")
      .select("content_id,user_id,status,completed_at,updated_at")
      .in("user_id", userIds)
      .in("content_id", contentIds)
      .order("updated_at", { ascending: false }),
  );
}

async function fetchQuizAttemptsForUsers(
  supabase: SupabaseServerClient,
  userIds: string[],
  quizIds: string[],
) {
  if (!userIds.length || !quizIds.length) {
    return [];
  }

  return getRows<QuizAttemptRow>(
    supabase
      .from("quiz_attempts")
      .select("id,quiz_id,user_id,percentage,status,passed,submitted_at,created_at")
      .in("user_id", userIds)
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
  coachProgressMaps?: {
    contentProgressByUserAndContentId: Map<string, ContentProgressRow[]>;
    membersByCohortId: Map<string, CohortMemberRow[]>;
    profileByUserId: Map<string, ProfileRow>;
    quizAttemptsByUserAndQuizId: Map<string, QuizAttemptRow[]>;
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
    const members = path.cohort_id
      ? (coachProgressMaps?.membersByCohortId.get(path.cohort_id) ?? [])
      : [];
    const learnerProgress = coachProgressMaps
      ? members
          .map((member) =>
            getLearnerProgress(
              path,
              items,
              contentsById,
              quizzesById,
              coachProgressMaps.profileByUserId,
              coachProgressMaps.contentProgressByUserAndContentId,
              coachProgressMaps.quizAttemptsByUserAndQuizId,
              member,
            ),
          )
          .toSorted((first, second) => {
            if (first.status === "blocked" && second.status !== "blocked") {
              return -1;
            }

            if (first.status !== "blocked" && second.status === "blocked") {
              return 1;
            }

            return first.percentage - second.percentage;
          })
      : undefined;

    return {
      cohortId: path.cohort_id ?? "",
      cohortName: cohort?.name ?? "Cohorte indisponible",
      coachSummary: learnerProgress ? coachSummary(learnerProgress) : undefined,
      createdAt: path.created_at,
      description: ensureText(path.description, "Parcours sans description."),
      id: path.id,
      itemCount: pathItems.length,
      items: pathItems,
      learnerProgress,
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
    const cohortIds = unique(paths.map((path) => path.cohort_id));
    const members = await fetchCohortMembers(supabase, cohortIds);
    const memberIds = unique(members.map((member) => member.user_id));
    const contentIds = unique(items.map((item) => item.content_id));
    const quizIds = unique(items.map((item) => item.quiz_id));
    const [profiles, activityLogs, contentProgressRows, quizAttempts] =
      await Promise.all([
        fetchProfiles(supabase, memberIds),
        fetchLearningPathActivityLogs(supabase, memberIds),
        fetchContentProgressForUsers(supabase, memberIds, contentIds),
        fetchQuizAttemptsForUsers(supabase, memberIds, quizIds),
      ]);
    const cohortsById = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
    const contentsById = new Map(contents.map((content) => [content.id, content]));
    const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const profileByUserId = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );
    const mappedPaths = buildPaths(
      paths,
      items,
      cohortsById,
      contentsById,
      quizzesById,
      undefined,
      {
        contentProgressByUserAndContentId: groupBy(contentProgressRows, (progress) =>
          progressKey(progress.user_id, progress.content_id),
        ),
        membersByCohortId: groupBy(members, (member) => member.cohort_id),
        profileByUserId,
        quizAttemptsByUserAndQuizId: groupBy(quizAttempts, (attempt) =>
          progressKey(attempt.user_id, attempt.quiz_id),
        ),
      },
    );

    return {
      cohorts: cohorts.map((cohort) => ({
        description: ensureText(cohort.description, "Aucune description"),
        id: cohort.id,
        name: cohort.name,
      })),
      itemOptions: getItemOptions(contents, quizzes),
      metrics: getCoachLearningPathMetrics(mappedPaths),
      paths: mappedPaths,
      signals: getCoachLearningPathSignals(
        mappedPaths,
        activityLogs,
        profileByUserId,
      ),
    };
  },
);

export const getCoachLearningPathEditorData = cache(
  async (pathId: string): Promise<CoachLearningPathEditorData | null> => {
    const currentUser = await requireRole(["admin", "coach"]);
    const supabase = await createServerSupabaseClient();
    const isAdmin = currentUser.role === "admin";

    let pathQuery = supabase
      .from("learning_paths")
      .select("id,title,description,cohort_id,created_by")
      .eq("id", pathId);
    let cohortsQuery = supabase
      .from("cohorts")
      .select("id,name,description,coach_id")
      .order("name", { ascending: true });

    if (!isAdmin) {
      pathQuery = pathQuery.eq("created_by", currentUser.user.id);
      cohortsQuery = cohortsQuery.eq("coach_id", currentUser.user.id);
    }

    const [pathResponse, cohorts, contents, quizzes, items] = await Promise.all([
      pathQuery.maybeSingle<{
        cohort_id: string | null;
        created_by: string;
        description: string | null;
        id: string;
        title: string;
      }>(),
      getRows<CohortRow>(cohortsQuery),
      fetchContents(supabase, undefined, isAdmin ? undefined : currentUser.user.id),
      fetchQuizzes(supabase, undefined, isAdmin ? undefined : currentUser.user.id),
      fetchPathItems(supabase, [pathId]),
    ]);

    if (pathResponse.error) {
      throw new Error(pathResponse.error.message);
    }

    if (!pathResponse.data) {
      return null;
    }

    return {
      cohorts: cohorts.map((cohort) => ({
        description: ensureText(cohort.description, "Aucune description"),
        id: cohort.id,
        name: cohort.name,
      })),
      itemOptions: getItemOptions(contents, quizzes),
      path: {
        cohortId: pathResponse.data.cohort_id ?? "",
        description: pathResponse.data.description ?? "",
        id: pathResponse.data.id,
        items: items
          .toSorted((first, second) => first.position - second.position)
          .map((item) =>
            item.content_id
              ? itemValue("content", item.content_id)
              : itemValue("quiz", item.quiz_id ?? ""),
          )
          .filter((value) => !value.endsWith(":")),
        title: pathResponse.data.title,
      },
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
