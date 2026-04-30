import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ContentStatus, ContentType } from "@/types/coaching";

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

export type LearningPathItemKind = "content" | "quiz";

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
  status?: ContentStatus;
  type?: ContentType;
};

export type CoachLearningPath = {
  cohortId: string;
  cohortName: string;
  createdAt: string;
  description: string;
  id: string;
  itemCount: number;
  items: LearningPathItem[];
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

function getPathItems(
  path: LearningPathRow,
  items: LearningPathItemRow[],
  contentsById: Map<string, ContentRow>,
  quizzesById: Map<string, QuizRow>,
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

function buildPaths(
  paths: LearningPathRow[],
  items: LearningPathItemRow[],
  cohortsById: Map<string, CohortRow>,
  contentsById: Map<string, ContentRow>,
  quizzesById: Map<string, QuizRow>,
): CoachLearningPath[] {
  return paths.map((path) => {
    const pathItems = getPathItems(path, items, contentsById, quizzesById);
    const cohort = path.cohort_id ? cohortsById.get(path.cohort_id) : null;

    return {
      cohortId: path.cohort_id ?? "",
      cohortName: cohort?.name ?? "Cohorte indisponible",
      createdAt: path.created_at,
      description: ensureText(path.description, "Parcours sans description."),
      id: path.id,
      itemCount: pathItems.length,
      items: pathItems,
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
    await requireRole(["admin", "coachee"]);
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
    const [contents, quizzes, cohorts] = await Promise.all([
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
    ]);
    const contentsById = new Map(contents.map((content) => [content.id, content]));
    const quizzesById = new Map(quizzes.map((quiz) => [quiz.id, quiz]));
    const cohortsById = new Map(cohorts.map((cohort) => [cohort.id, cohort]));
    const mappedPaths = buildPaths(
      paths,
      items,
      cohortsById,
      contentsById,
      quizzesById,
    );

    return {
      metrics: {
        contentCount: items.filter((item) => item.content_id).length,
        pathCount: mappedPaths.length,
        quizCount: items.filter((item) => item.quiz_id).length,
        totalItemCount: items.length,
      },
      paths: mappedPaths,
    };
  },
);
