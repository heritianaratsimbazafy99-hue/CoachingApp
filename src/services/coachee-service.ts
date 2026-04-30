import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getCoacheeLearningPathData,
  type CoacheeLearningPathData,
} from "@/services/learning-path-service";
import { getUserNotificationPreferenceCategories } from "@/services/profile-service";
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

type CoacheeCohortMemberRow = {
  cohort_id: string;
};

type ActivityLogRow = {
  action: string;
  created_at: string;
  entity_id: string | null;
  entity_type: string;
  id: string;
  metadata: Record<string, unknown> | null;
};

type UnreadMessageRow = {
  body: string;
  created_at: string;
  id: string;
  sender_id: string;
};

type UnreadMessages = {
  count: number;
  latest: UnreadMessageRow[];
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

export type CoacheeActivity = {
  action: string;
  createdAt: string;
  detail: string;
  href: string;
  id: string;
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
  recentActivity: CoacheeActivity[];
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

export type CoacheeNotificationCategory =
  | "agenda"
  | "messages"
  | "paths"
  | "results";

export type CoacheeNotificationFilter = "all" | CoacheeNotificationCategory;

export type CoacheeNotificationItem = {
  category: CoacheeNotificationCategory;
  createdAt: string;
  description: string;
  href: string;
  id: string;
  isUnread: boolean;
  priority: "high" | "normal";
  title: string;
};

export type CoacheeNotificationsData = {
  enabledNotificationCategories: CoacheeNotificationCategory[];
  filters: Array<{
    count: number;
    id: CoacheeNotificationFilter;
    label: string;
  }>;
  metrics: {
    highPriorityCount: number;
    totalCount: number;
    unreadMessagesCount: number;
  };
  notifications: CoacheeNotificationItem[];
};

type CoacheeBaseData = {
  activityLogs: ActivityLogRow[];
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

function compactText(value: string, maxLength = 120) {
  const normalized = value.replace(/\s+/g, " ").trim();

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 3)}...`
    : normalized;
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

function metadataText(
  metadata: Record<string, unknown> | null,
  key: string,
  fallback = "",
) {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value : fallback;
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

async function fetchCalendarEvents(userId: string, isAdmin: boolean) {
  const supabase = createServiceSupabaseClient();
  const memberships = isAdmin
    ? []
    : await getRows<CoacheeCohortMemberRow>(
        supabase
          .from("cohort_members")
          .select("cohort_id")
          .eq("user_id", userId),
      );
  const cohortIds = unique(memberships.map((membership) => membership.cohort_id));
  let eventQuery = supabase
    .from("calendar_events")
    .select("id,title,start_time,end_time,type,status")
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(4);

  if (!isAdmin) {
    eventQuery = cohortIds.length
      ? eventQuery.or(
          `coachee_id.eq.${userId},cohort_id.in.(${cohortIds.join(",")})`,
        )
      : eventQuery.eq("coachee_id", userId);
  }

  return getRows<CalendarEventRow>(eventQuery);
}

async function fetchActivityLogs(
  supabase: SupabaseServerClient,
  userId: string,
) {
  return getRows<ActivityLogRow>(
    supabase
      .from("activity_logs")
      .select("id,action,entity_type,entity_id,metadata,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(6),
  );
}

async function fetchUnreadMessages(
  userId: string,
  limit = 20,
): Promise<UnreadMessages> {
  const supabase = createServiceSupabaseClient();
  const { count, data, error } = await supabase
    .from("messages")
    .select("id,sender_id,body,created_at", { count: "exact" })
    .eq("receiver_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: count ?? (data ?? []).length,
    latest: (data ?? []) as UnreadMessageRow[],
  };
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

function activityHref(activity: ActivityLogRow) {
  const pathId = metadataText(activity.metadata, "learningPathId");

  if (pathId) {
    return "/coachee/paths";
  }

  if (activity.entity_type === "quiz_attempt" && activity.entity_id) {
    return `/coachee/results?attempt=${activity.entity_id}`;
  }

  if (activity.entity_type === "content" && activity.entity_id) {
    return `/coachee/contents/${activity.entity_id}`;
  }

  return "/coachee/tasks";
}

function mapActivity(activity: ActivityLogRow): CoacheeActivity {
  const detail =
    metadataText(activity.metadata, "resourceTitle") ||
    metadataText(activity.metadata, "learningPathTitle") ||
    (activity.entity_type === "quiz_attempt" ? "Quiz" : "Activité");

  return {
    action: activity.action,
    createdAt: activity.created_at,
    detail,
    href: activityHref(activity),
    id: activity.id,
  };
}

const getCoacheeBaseData = cache(async (): Promise<CoacheeBaseData> => {
  const currentUser = await requireRole(["admin", "coachee"]);
  const supabase = await createServerSupabaseClient();
  const userId = currentUser.user.id;
  const isAdmin = currentUser.role === "admin";
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
    activityLogs,
  ] = await Promise.all([
    fetchAssignmentProgress(supabase, assignmentIds, userId),
    fetchContentProgress(supabase, contentIds, userId),
    fetchContents(supabase, contentIds),
    fetchQuizzes(supabase, quizIds),
    fetchQuizAttempts(supabase, userId),
    fetchCalendarEvents(userId, isAdmin),
    fetchActivityLogs(supabase, userId),
  ]);

  const displayName =
    currentUser.profile?.full_name || currentUser.user.email || "Coaché";

  return {
    activityLogs,
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

function buildCoacheeNotificationFilters(
  notifications: CoacheeNotificationItem[],
): CoacheeNotificationsData["filters"] {
  const countFor = (category: CoacheeNotificationCategory) =>
    notifications.filter((notification) => notification.category === category)
      .length;

  return [
    { count: notifications.length, id: "all", label: "Tout" },
    { count: countFor("messages"), id: "messages", label: "Messages" },
    { count: countFor("paths"), id: "paths", label: "Parcours" },
    { count: countFor("agenda"), id: "agenda", label: "Agenda" },
    { count: countFor("results"), id: "results", label: "Résultats" },
  ];
}

function buildCoacheeNotifications({
  base,
  unreadMessages,
}: {
  base: CoacheeBaseData;
  unreadMessages: UnreadMessages;
}) {
  const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
  const messageNotifications = unreadMessages.latest.map((message) => ({
    category: "messages" as const,
    createdAt: message.created_at,
    description: compactText(message.body),
    href: `/coachee/messages?conversation=${message.sender_id}`,
    id: `message:${message.id}`,
    isUnread: true,
    priority: "high" as const,
    title: "Message non lu",
  }));
  const agendaNotifications = base.calendarEvents
    .filter((event) => event.status === "scheduled")
    .slice(0, 5)
    .map((event) => {
      const startsAt = new Date(event.start_time).getTime();
      const soonLimit = Date.now() + 1000 * 60 * 60 * 48;

      return {
        category: "agenda" as const,
        createdAt: event.start_time,
        description: event.title,
        href: "/coachee/calendar",
        id: `agenda:${event.id}`,
        isUnread: false,
        priority: startsAt <= soonLimit ? ("high" as const) : ("normal" as const),
        title: "Rendez-vous à venir",
      };
    });
  const resultNotifications = base.quizAttempts.slice(0, 6).map((attempt) => {
    const quizTitle = quizzesById.get(attempt.quiz_id)?.title ?? "Quiz";

    return {
      category: "results" as const,
      createdAt: attempt.submitted_at ?? attempt.created_at,
      description: `${quizTitle} · ${Math.round(Number(attempt.percentage))}%`,
      href: "/coachee/results",
      id: `result:${attempt.id}`,
      isUnread: false,
      priority:
        attempt.status === "failed" || attempt.status === "pending_correction"
          ? ("high" as const)
          : ("normal" as const),
      title:
        attempt.status === "pending_correction"
          ? "Résultat en correction"
          : attempt.status === "failed"
            ? "Quiz à reprendre"
            : "Quiz réussi",
    };
  });

  return [
    ...messageNotifications,
    ...agendaNotifications,
    ...resultNotifications,
  ];
}

function buildCoacheePathNotifications(
  pathData: CoacheeLearningPathData,
): CoacheeNotificationItem[] {
  return pathData.paths
    .filter((path) => (path.progress?.percentage ?? 0) < 100)
    .slice(0, 8)
    .map((path) => {
      const failedItem = path.items.find(
        (item) => item.progress?.status === "failed",
      );
      const pendingCorrectionItem = path.items.find(
        (item) => item.progress?.status === "pending_correction",
      );
      const nextHref = failedItem?.href || path.progress?.nextHref || "/coachee/paths";
      const nextLabel =
        failedItem?.label ||
        pendingCorrectionItem?.label ||
        path.progress?.nextLabel ||
        "Prochaine étape";

      return {
        category: "paths" as const,
        createdAt: path.createdAt,
        description: `${path.title} · ${nextLabel}`,
        href: nextHref,
        id: `path:${path.id}`,
        isUnread: false,
        priority: failedItem ? ("high" as const) : ("normal" as const),
        title: failedItem ? "Parcours à reprendre" : "Prochaine étape parcours",
      };
    });
}

function mergeNotificationItems(
  notifications: CoacheeNotificationItem[],
): CoacheeNotificationItem[] {
  const deduped = new Map<string, CoacheeNotificationItem>();

  notifications.forEach((notification) => {
    deduped.set(notification.id, notification);
  });

  return [...deduped.values()]
    .toSorted((first, second) => {
      const priorityDelta =
        Number(second.priority === "high") - Number(first.priority === "high");

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      if (first.category === "agenda" && second.category === "agenda") {
        return (
          new Date(first.createdAt).getTime() -
          new Date(second.createdAt).getTime()
        );
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    })
    .slice(0, 80);
}

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
      recentActivity: base.activityLogs.map(mapActivity),
      resources,
      tasks: tasks.slice(0, 5),
    };
  });

export const getCoacheeNotificationsData =
  cache(async (): Promise<CoacheeNotificationsData> => {
    const base = await getCoacheeBaseData();
    const [enabledNotificationCategories, pathData, unreadMessages] =
      await Promise.all([
        getUserNotificationPreferenceCategories({
          role: "coachee",
          userId: base.userId,
        }),
        getCoacheeLearningPathData(),
        fetchUnreadMessages(base.userId, 30),
      ]);
    const notifications = mergeNotificationItems([
      ...buildCoacheeNotifications({ base, unreadMessages }),
      ...buildCoacheePathNotifications(pathData),
    ]);
    const highPriorityCount = notifications.filter(
      (notification) => notification.priority === "high",
    ).length;

    return {
      enabledNotificationCategories:
        enabledNotificationCategories as CoacheeNotificationCategory[],
      filters: buildCoacheeNotificationFilters(notifications),
      metrics: {
        highPriorityCount,
        totalCount: notifications.length,
        unreadMessagesCount: unreadMessages.count,
      },
      notifications,
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
