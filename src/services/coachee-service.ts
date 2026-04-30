import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type {
  AssignmentStatus,
  AssignmentType,
  CalendarEventStatus,
  CalendarEventType,
  ContentStatus,
  ContentType,
  Priority,
  QuestionType,
  QuizAttemptStatus,
} from "@/types/coaching";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type AssignmentRow = {
  assigned_by: string;
  assigned_to_cohort_id: string | null;
  assigned_to_user_id: string | null;
  assignment_type: AssignmentType;
  content_id: string | null;
  created_at: string;
  deadline: string;
  description: string | null;
  id: string;
  instructions: string | null;
  priority: Priority;
  quiz_id: string | null;
  status: AssignmentStatus;
  title: string;
};

type AssignmentProgressRow = {
  assignment_id: string;
  completed_at: string | null;
  id: string;
  is_late: boolean;
  started_at: string | null;
  status: AssignmentStatus;
  updated_at: string;
  user_id: string;
};

type ContentProgressRow = {
  assignment_id: string | null;
  completed_at: string | null;
  content_id: string;
  id: string;
  status: AssignmentStatus;
  user_id: string;
};

type ContentRow = {
  body: string | null;
  description: string | null;
  external_url: string | null;
  file_url: string | null;
  id: string;
  status: ContentStatus;
  tags: string[];
  title: string;
  type: ContentType;
  updated_at: string;
  video_url: string | null;
};

type QuizRow = {
  content_id: string | null;
  description: string | null;
  id: string;
  passing_score: number;
  title: string;
  updated_at: string;
};

type QuizQuestionRow = {
  explanation: string | null;
  id: string;
  points: number;
  position: number;
  question_text: string;
  question_type: QuestionType;
  quiz_id: string;
};

type QuizOptionRow = {
  id: string;
  is_correct: boolean;
  option_text: string;
  position: number;
  question_id: string;
};

type QuizAttemptRow = {
  assignment_id: string | null;
  corrected_at: string | null;
  created_at: string;
  id: string;
  passed: boolean;
  percentage: number;
  quiz_id: string;
  score_max: number;
  score_obtained: number;
  status: QuizAttemptStatus;
  submitted_at: string | null;
  user_id: string;
};

type CalendarEventRow = {
  end_time: string;
  id: string;
  start_time: string;
  status: CalendarEventStatus;
  title: string;
  type: CalendarEventType;
};

type LearningPathItemRow = {
  content_id: string | null;
  id: string;
  learning_path_id: string;
  position: number;
  quiz_id: string | null;
};

export type CoacheeTask = {
  assignmentType: AssignmentType;
  contentId: string;
  contentTitle: string;
  createdAt: string;
  ctaLabel: string;
  deadline: string;
  description: string;
  href: string;
  id: string;
  instructions: string;
  priority: Priority;
  progressStatus: AssignmentStatus;
  quizId: string;
  quizTitle: string;
  status: AssignmentStatus;
  title: string;
};

export type CoacheeCalendarEvent = {
  endTime: string;
  id: string;
  startTime: string;
  status: CalendarEventStatus;
  title: string;
  type: CalendarEventType;
};

export type CoacheeDashboardData = {
  calendarEvents: CoacheeCalendarEvent[];
  firstName: string;
  metrics: {
    averageScore: number;
    completedTasksCount: number;
    nextEventsCount: number;
    openTasksCount: number;
    progress: number;
  };
  nextTask: CoacheeTask | null;
  resources: Array<{
    description: string;
    href: string;
    id: string;
    title: string;
    type: ContentType;
  }>;
  tasks: CoacheeTask[];
};

export type CoacheeTasksData = {
  tasks: CoacheeTask[];
};

export type CoacheeContentDetail = {
  assignment: CoacheeTask | null;
  content: {
    body: string;
    description: string;
    externalUrl: string;
    fileUrl: string;
    id: string;
    status: ContentStatus;
    tags: string[];
    title: string;
    type: ContentType;
    updatedAt: string;
    videoUrl: string;
  };
  progressStatus: AssignmentStatus | null;
  quizHref: string | null;
  quizTitle: string | null;
};

export type CoacheeQuizQuestionOption = {
  id: string;
  optionText: string;
  position: number;
};

export type CoacheeQuizQuestion = {
  explanation: string;
  id: string;
  options: CoacheeQuizQuestionOption[];
  points: number;
  position: number;
  questionText: string;
  questionType: QuestionType;
};

export type CoacheeQuiz = {
  description: string;
  id: string;
  passingScore: number;
  questions: CoacheeQuizQuestion[];
  title: string;
};

export type CoacheeQuizData = {
  assignment: CoacheeTask | null;
  latestAttempt: {
    id: string;
    percentage: number;
    scoreMax: number;
    scoreObtained: number;
    status: QuizAttemptStatus;
    submittedAt: string;
  } | null;
  quiz: CoacheeQuiz;
};

export type CoacheeResultRow = {
  assignmentTitle: string;
  correctedAt: string | null;
  id: string;
  passed: boolean;
  percentage: number;
  quizTitle: string;
  scoreMax: number;
  scoreObtained: number;
  status: QuizAttemptStatus;
  submittedAt: string;
};

export type CoacheeResultsData = {
  metrics: {
    attemptsCount: number;
    averageScore: number;
    passedCount: number;
    pendingCorrectionsCount: number;
  };
  results: CoacheeResultRow[];
};

type CoacheeBaseData = {
  assignments: AssignmentRow[];
  assignmentProgress: AssignmentProgressRow[];
  calendarEvents: CalendarEventRow[];
  contentProgress: ContentProgressRow[];
  contents: ContentRow[];
  firstName: string;
  quizAttempts: QuizAttemptRow[];
  quizzes: QuizRow[];
  userId: string;
};

function average(values: number[]) {
  if (!values.length) {
    return 0;
  }

  return Math.round(
    values.reduce((sum, value) => sum + Number(value ?? 0), 0) / values.length,
  );
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter(Boolean) as string[])];
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

async function getRows<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as T[];
}

async function fetchAssignments(supabase: SupabaseServerClient) {
  return getRows<AssignmentRow>(
    supabase
      .from("assignments")
      .select(
        "id,title,description,assignment_type,content_id,quiz_id,assigned_to_user_id,assigned_to_cohort_id,assigned_by,deadline,priority,status,instructions,created_at",
      )
      .order("deadline", { ascending: true }),
  );
}

async function fetchAssignmentProgress(
  supabase: SupabaseServerClient,
  assignmentIds: string[],
  userId: string,
) {
  if (!assignmentIds.length) {
    return [];
  }

  return getRows<AssignmentProgressRow>(
    supabase
      .from("assignment_progress")
      .select(
        "id,assignment_id,user_id,status,started_at,completed_at,is_late,updated_at",
      )
      .eq("user_id", userId)
      .in("assignment_id", assignmentIds),
  );
}

async function fetchContentProgress(
  supabase: SupabaseServerClient,
  contentIds: string[],
  userId: string,
) {
  if (!contentIds.length) {
    return [];
  }

  return getRows<ContentProgressRow>(
    supabase
      .from("content_progress")
      .select("id,content_id,user_id,assignment_id,status,completed_at")
      .eq("user_id", userId)
      .in("content_id", contentIds),
  );
}

async function fetchContents(
  supabase: SupabaseServerClient,
  contentIds: string[],
) {
  if (!contentIds.length) {
    return [];
  }

  return getRows<ContentRow>(
    supabase
      .from("contents")
      .select(
        "id,title,description,type,body,video_url,external_url,file_url,status,tags,updated_at",
      )
      .in("id", contentIds)
      .order("updated_at", { ascending: false }),
  );
}

async function fetchQuizzes(supabase: SupabaseServerClient, quizIds: string[]) {
  if (!quizIds.length) {
    return [];
  }

  return getRows<QuizRow>(
    supabase
      .from("quizzes")
      .select("id,title,description,content_id,passing_score,updated_at")
      .in("id", quizIds)
      .order("updated_at", { ascending: false }),
  );
}

async function fetchQuizAttempts(supabase: SupabaseServerClient, userId: string) {
  return getRows<QuizAttemptRow>(
    supabase
      .from("quiz_attempts")
      .select(
        "id,quiz_id,assignment_id,user_id,score_obtained,score_max,percentage,status,passed,submitted_at,corrected_at,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}

async function fetchCalendarEvents(supabase: SupabaseServerClient) {
  return getRows<CalendarEventRow>(
    supabase
      .from("calendar_events")
      .select("id,title,start_time,end_time,type,status")
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true })
      .limit(4),
  );
}

async function fetchLearningPathItems(supabase: SupabaseServerClient) {
  return getRows<LearningPathItemRow>(
    supabase
      .from("learning_path_items")
      .select("id,learning_path_id,content_id,quiz_id,position")
      .order("position", { ascending: true }),
  );
}

async function fetchQuizQuestions(
  supabase: SupabaseServerClient,
  quizId: string,
) {
  return getRows<QuizQuestionRow>(
    supabase
      .from("quiz_questions")
      .select("id,quiz_id,question_text,question_type,points,position,explanation")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true }),
  );
}

async function fetchQuizOptions(
  supabase: SupabaseServerClient,
  questionIds: string[],
) {
  if (!questionIds.length) {
    return [];
  }

  return getRows<QuizOptionRow>(
    supabase
      .from("quiz_options")
      .select("id,question_id,option_text,is_correct,position")
      .in("question_id", questionIds)
      .order("position", { ascending: true }),
  );
}

function getAssignmentStatus(
  assignment: AssignmentRow,
  progressByAssignment: Map<string, AssignmentProgressRow[]>,
) {
  return progressByAssignment.get(assignment.id)?.[0]?.status ?? assignment.status;
}

function taskHref(
  assignment: AssignmentRow,
  progressStatus: AssignmentStatus,
  contentCompleted: boolean,
) {
  const assignmentQuery = `?assignment=${assignment.id}`;

  if (
    assignment.content_id &&
    (!assignment.quiz_id || (progressStatus !== "completed" && !contentCompleted))
  ) {
    return `/coachee/contents/${assignment.content_id}${assignmentQuery}`;
  }

  if (assignment.quiz_id) {
    return `/coachee/quiz/${assignment.quiz_id}${assignmentQuery}`;
  }

  return assignment.content_id
    ? `/coachee/contents/${assignment.content_id}${assignmentQuery}`
    : "/coachee/tasks";
}

function buildTasks(base: CoacheeBaseData): CoacheeTask[] {
  const contentsById = new Map(base.contents.map((content) => [content.id, content]));
  const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
  const progressByAssignment = groupBy(
    base.assignmentProgress,
    (progress) => progress.assignment_id,
  );
  const contentProgressByAssignment = groupBy(
    base.contentProgress.filter((progress) => progress.assignment_id),
    (progress) => progress.assignment_id ?? "",
  );
  const contentProgressByContent = groupBy(
    base.contentProgress,
    (progress) => progress.content_id,
  );

  return base.assignments.map((assignment) => {
    const progressStatus = getAssignmentStatus(assignment, progressByAssignment);
    const contentProgressRows = assignment.content_id
      ? [
          ...(contentProgressByAssignment.get(assignment.id) ?? []),
          ...(contentProgressByContent.get(assignment.content_id) ?? []),
        ]
      : [];
    const contentCompleted = contentProgressRows.some(
      (progress) => progress.status === "completed",
    );

    return {
      assignmentType: assignment.assignment_type,
      contentId: assignment.content_id ?? "",
      contentTitle: assignment.content_id
        ? contentsById.get(assignment.content_id)?.title ?? "Contenu indisponible"
        : "",
      createdAt: assignment.created_at,
      ctaLabel:
        assignment.quiz_id && progressStatus === "completed"
          ? "Revoir"
          : assignment.quiz_id && contentCompleted
            ? "Passer le quiz"
          : assignment.quiz_id && !assignment.content_id
            ? "Passer le quiz"
            : "Continuer",
      deadline: assignment.deadline,
      description: assignment.description ?? "",
      href: taskHref(assignment, progressStatus, contentCompleted),
      id: assignment.id,
      instructions: assignment.instructions ?? "",
      priority: assignment.priority,
      progressStatus,
      quizId: assignment.quiz_id ?? "",
      quizTitle: assignment.quiz_id
        ? quizzesById.get(assignment.quiz_id)?.title ?? "Quiz indisponible"
        : "",
      status: assignment.status,
      title: assignment.title,
    };
  });
}

const getCoacheeBaseData = cache(async (): Promise<CoacheeBaseData> => {
  const currentUser = await requireRole(["admin", "coachee"]);
  const supabase = await createServerSupabaseClient();
  const userId = currentUser.user.id;
  const [assignments, learningPathItems] = await Promise.all([
    fetchAssignments(supabase),
    fetchLearningPathItems(supabase),
  ]);
  const assignmentIds = assignments.map((assignment) => assignment.id);
  const contentIds = unique([
    ...assignments.map((assignment) => assignment.content_id),
    ...learningPathItems.map((item) => item.content_id),
  ]);
  const quizIds = unique([
    ...assignments.map((assignment) => assignment.quiz_id),
    ...learningPathItems.map((item) => item.quiz_id),
  ]);

  const [
    assignmentProgress,
    contentProgress,
    contents,
    quizzes,
    quizAttempts,
    calendarEvents,
  ] = await Promise.all([
    fetchAssignmentProgress(supabase, assignmentIds, userId),
    fetchContentProgress(supabase, contentIds, userId),
    fetchContents(supabase, contentIds),
    fetchQuizzes(supabase, quizIds),
    fetchQuizAttempts(supabase, userId),
    fetchCalendarEvents(supabase),
  ]);

  const displayName =
    currentUser.profile?.full_name || currentUser.user.email || "Coaché";

  return {
    assignments,
    assignmentProgress,
    calendarEvents,
    contentProgress,
    contents,
    firstName: displayName.split(" ")[0] ?? displayName,
    quizAttempts,
    quizzes,
    userId,
  };
});

export const getCoacheeDashboardData =
  cache(async (): Promise<CoacheeDashboardData> => {
    const base = await getCoacheeBaseData();
    const tasks = buildTasks(base);
    const openTasks = tasks.filter((task) => task.progressStatus !== "completed");
    const resources = tasks
      .filter((task) => task.contentId)
      .slice(0, 4)
      .map((task) => {
        const content = base.contents.find((item) => item.id === task.contentId);

        return {
          description: content?.description ?? task.description,
          href: `/coachee/contents/${task.contentId}?assignment=${task.id}`,
          id: task.id,
          title: task.contentTitle || task.title,
          type: content?.type ?? "text",
        };
      });

    return {
      calendarEvents: base.calendarEvents.map((event) => ({
        endTime: event.end_time,
        id: event.id,
        startTime: event.start_time,
        status: event.status,
        title: event.title,
        type: event.type,
      })),
      firstName: base.firstName,
      metrics: {
        averageScore: average(base.quizAttempts.map((attempt) => attempt.percentage)),
        completedTasksCount: tasks.filter(
          (task) => task.progressStatus === "completed",
        ).length,
        nextEventsCount: base.calendarEvents.length,
        openTasksCount: openTasks.length,
        progress: tasks.length
          ? Math.round(
              (tasks.filter((task) => task.progressStatus === "completed").length /
                tasks.length) *
                100,
            )
          : 0,
      },
      nextTask: openTasks[0] ?? tasks[0] ?? null,
      resources,
      tasks: tasks.slice(0, 5),
    };
  });

export const getCoacheeTasksData =
  cache(async (): Promise<CoacheeTasksData> => {
    const base = await getCoacheeBaseData();

    return {
      tasks: buildTasks(base),
    };
  });

export const getCoacheeContentDetail = cache(
  async (
    contentId: string,
    assignmentId?: string,
  ): Promise<CoacheeContentDetail | null> => {
    const base = await getCoacheeBaseData();
    const tasks = buildTasks(base);
    const content = base.contents.find((item) => item.id === contentId);

    if (!content) {
      return null;
    }

    const assignment =
      (assignmentId ? tasks.find((task) => task.id === assignmentId) : null) ??
      tasks.find((task) => task.contentId === contentId) ??
      null;
    const progress =
      base.contentProgress.find(
        (item) =>
          item.content_id === contentId &&
          (!assignment?.id || item.assignment_id === assignment.id),
      ) ?? null;
    const quiz = assignment?.quizId
      ? base.quizzes.find((item) => item.id === assignment.quizId)
      : null;

    return {
      assignment,
      content: {
        body: content.body ?? "",
        description: content.description ?? "",
        externalUrl: content.external_url ?? "",
        fileUrl: content.file_url ?? "",
        id: content.id,
        status: content.status,
        tags: content.tags ?? [],
        title: content.title,
        type: content.type,
        updatedAt: content.updated_at,
        videoUrl: content.video_url ?? "",
      },
      progressStatus: progress?.status ?? assignment?.progressStatus ?? null,
      quizHref:
        assignment?.quizId && quiz
          ? `/coachee/quiz/${assignment.quizId}?assignment=${assignment.id}`
          : null,
      quizTitle: quiz?.title ?? null,
    };
  },
);

export const getCoacheeQuizData = cache(
  async (quizId: string, assignmentId?: string): Promise<CoacheeQuizData | null> => {
    const base = await getCoacheeBaseData();
    const supabase = await createServerSupabaseClient();
    const tasks = buildTasks(base);
    const quiz = base.quizzes.find((item) => item.id === quizId);

    if (!quiz) {
      return null;
    }

    const assignment =
      (assignmentId ? tasks.find((task) => task.id === assignmentId) : null) ??
      tasks.find((task) => task.quizId === quizId) ??
      null;
    const questions = await fetchQuizQuestions(supabase, quizId);
    const options = await fetchQuizOptions(
      supabase,
      questions.map((question) => question.id),
    );
    const optionsByQuestion = groupBy(options, (option) => option.question_id);
    const attempts = base.quizAttempts.filter((attempt) => attempt.quiz_id === quizId);
    const latestAttempt = attempts[0];

    return {
      assignment,
      latestAttempt: latestAttempt
        ? {
            id: latestAttempt.id,
            percentage: Number(latestAttempt.percentage),
            scoreMax: Number(latestAttempt.score_max),
            scoreObtained: Number(latestAttempt.score_obtained),
            status: latestAttempt.status,
            submittedAt: latestAttempt.submitted_at ?? latestAttempt.created_at,
          }
        : null,
      quiz: {
        description: quiz.description ?? "",
        id: quiz.id,
        passingScore: Number(quiz.passing_score),
        questions: questions
          .toSorted((a, b) => a.position - b.position)
          .map((question) => ({
            explanation: question.explanation ?? "",
            id: question.id,
            options: (optionsByQuestion.get(question.id) ?? [])
              .toSorted((a, b) => a.position - b.position)
              .map((option) => ({
                id: option.id,
                optionText: option.option_text,
                position: option.position,
              })),
            points: Number(question.points),
            position: question.position,
            questionText: question.question_text,
            questionType: question.question_type,
          })),
        title: quiz.title,
      },
    };
  },
);

export const getCoacheeResultsData =
  cache(async (): Promise<CoacheeResultsData> => {
    const base = await getCoacheeBaseData();
    const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
    const assignmentsById = new Map(
      base.assignments.map((assignment) => [assignment.id, assignment]),
    );
    const results = base.quizAttempts.map((attempt) => ({
      assignmentTitle: attempt.assignment_id
        ? assignmentsById.get(attempt.assignment_id)?.title ?? "Assignation supprimée"
        : "Hors assignation",
      correctedAt: attempt.corrected_at,
      id: attempt.id,
      passed: attempt.passed,
      percentage: Number(attempt.percentage),
      quizTitle: quizzesById.get(attempt.quiz_id)?.title ?? "Quiz supprimé",
      scoreMax: Number(attempt.score_max),
      scoreObtained: Number(attempt.score_obtained),
      status: attempt.status,
      submittedAt: attempt.submitted_at ?? attempt.created_at,
    }));

    return {
      metrics: {
        attemptsCount: results.length,
        averageScore: average(results.map((result) => result.percentage)),
        passedCount: results.filter((result) => result.passed).length,
        pendingCorrectionsCount: results.filter(
          (result) => result.status === "pending_correction",
        ).length,
      },
      results,
    };
  });
