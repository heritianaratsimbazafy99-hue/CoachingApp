import { cache } from "react";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getCoachLearningPathData,
  type CoachLearningPathData,
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
import {
  parseReminderTemplateTitle,
  type ReminderTemplateUsage,
} from "@/utils/reminders";

type SupabaseServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

type ProfileRow = {
  avatar_url: string | null;
  created_at: string;
  full_name: string;
  id: string;
  role: "admin" | "coach" | "coachee";
  user_id: string;
};

type CohortRow = {
  coach_id: string;
  created_at: string;
  description: string | null;
  end_date: string | null;
  id: string;
  name: string;
  start_date: string | null;
};

type CohortMemberRow = {
  cohort_id: string;
  created_at: string;
  id: string;
  user_id: string;
};

type ContentRow = {
  body: string | null;
  created_by: string;
  description: string | null;
  external_url: string | null;
  file_url: string | null;
  id: string;
  status: ContentStatus;
  subtheme_id: string | null;
  tags: string[];
  theme_id: string | null;
  title: string;
  type: ContentType;
  updated_at: string;
  video_url: string | null;
};

type ThemeRow = {
  created_by: string;
  description: string | null;
  id: string;
  title: string;
};

type SubthemeRow = {
  description: string | null;
  id: string;
  theme_id: string;
  title: string;
};

type QuizRow = {
  content_id: string | null;
  created_at: string;
  created_by: string;
  description: string | null;
  id: string;
  passing_score: number;
  title: string;
  updated_at: string;
};

type QuizQuestionRow = {
  created_at: string;
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

type QuizAnswerRow = {
  answer_text: string | null;
  attempt_id: string;
  coach_feedback: string | null;
  corrected_at: string | null;
  corrected_by: string | null;
  id: string;
  is_correct: boolean | null;
  needs_manual_correction: boolean;
  points_obtained: number;
  question_id: string;
  selected_option_ids: string[];
};

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
  cohort_id: string | null;
  coachee_id: string | null;
  coach_id: string;
  description: string | null;
  end_time: string;
  id: string;
  start_time: string;
  status: CalendarEventStatus;
  title: string;
  type: CalendarEventType;
};

type CoachNoteRow = {
  coachee_id: string;
  coach_id: string;
  created_at: string;
  id: string;
  note: string;
};

type CoacheeGoalRow = {
  coachee_id: string;
  coach_id: string;
  created_at: string;
  due_date: string | null;
  id: string;
  status: string;
  title: string;
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

type DashboardUnreadMessageRow = {
  body: string;
  created_at: string;
  id: string;
  sender_id: string;
};

type DashboardUnreadMessages = {
  count: number;
  latest: DashboardUnreadMessageRow[];
};

type AuthUserSummary = {
  email: string;
  lastSignInAt: string | null;
};

export type CoachCoacheeSummary = {
  email: string;
  fullName: string;
  id: string;
  lastActiveAt: string;
  lateAssignmentsCount: number;
  pendingCorrectionsCount: number;
  progress: number;
  scoreAverage: number;
};

export type CoachReminderTemplate = {
  body: string;
  id: string;
  title: string;
  usage: ReminderTemplateUsage;
};

export type CoachCoacheesData = {
  coachees: CoachCoacheeSummary[];
  reminderTemplates: CoachReminderTemplate[];
};

export type CoachAssignmentSummary = {
  contentTitle: string;
  createdAt: string;
  deadline: string;
  description: string;
  id: string;
  instructions: string;
  priority: Priority;
  status: AssignmentStatus;
  targetLabel: string;
  title: string;
  type: AssignmentType;
};

export type CoachQuizOption = {
  contentId: string;
  id: string;
  title: string;
};

export type CoachQuizQuestionOption = {
  id: string;
  isCorrect: boolean;
  optionText: string;
  position: number;
};

export type CoachQuizQuestion = {
  explanation: string;
  id: string;
  options: CoachQuizQuestionOption[];
  points: number;
  position: number;
  questionText: string;
  questionType: QuestionType;
};

export type CoachQuiz = {
  contentId: string;
  contentTitle: string;
  createdAt: string;
  description: string;
  id: string;
  isOwner: boolean;
  passingScore: number;
  questions: CoachQuizQuestion[];
  title: string;
  updatedAt: string;
};

export type CoachQuizSummary = {
  assignmentCount: number;
  averageScore: number;
  contentTitle: string;
  createdAt: string;
  description: string;
  id: string;
  isOwner: boolean;
  passingScore: number;
  pendingCorrectionsCount: number;
  questionCount: number;
  title: string;
  updatedAt: string;
};

export type CoachQuizzesData = {
  metrics: {
    averageScore: number;
    pendingCorrectionsCount: number;
    publishedQuizCount: number;
    totalQuizCount: number;
  };
  quizzes: CoachQuizSummary[];
};

export type CoachQuizEditorData = {
  contents: Array<Pick<CoachContent, "id" | "status" | "title" | "type">>;
  quiz: CoachQuiz | null;
};

export type CoachQuizResultRow = {
  assignmentTitle: string;
  coacheeEmail: string;
  coacheeName: string;
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

export type CoachQuizResultsData = {
  metrics: {
    attemptsCount: number;
    averageScore: number;
    passedCount: number;
    pendingCorrectionsCount: number;
  };
  results: CoachQuizResultRow[];
};

export type CoachCorrectionItem = {
  answerId: string;
  answerText: string;
  attemptId: string;
  coachFeedback: string;
  coacheeEmail: string;
  coacheeName: string;
  pointsMax: number;
  pointsObtained: number;
  questionText: string;
  quizTitle: string;
  submittedAt: string;
};

export type CoachCorrectionsData = {
  corrections: CoachCorrectionItem[];
  metrics: {
    pendingAnswersCount: number;
    pendingAttemptsCount: number;
  };
};

export type CoachCalendarEvent = {
  endTime: string;
  id: string;
  startTime: string;
  status: CalendarEventStatus;
  title: string;
  type: CalendarEventType;
};

export type CoachActivity = {
  action: string;
  createdAt: string;
  entityType: string;
  id: string;
};

export type CoachDashboardAttentionItem = {
  count: number;
  description: string;
  href: string;
  id: "correction" | "late_assignment" | "message" | "path_blocked";
  label: string;
  title: string;
};

export type CoachNotificationCategory =
  | "activity"
  | "corrections"
  | "late"
  | "messages"
  | "paths";

export type CoachNotificationFilter = "all" | CoachNotificationCategory;

export type CoachNotificationItem = {
  category: CoachNotificationCategory;
  createdAt: string;
  description: string;
  href: string;
  id: string;
  isUnread: boolean;
  priority: "high" | "normal";
  title: string;
};

export type CoachNotificationsData = {
  enabledNotificationCategories: CoachNotificationCategory[];
  filters: Array<{
    count: number;
    id: CoachNotificationFilter;
    label: string;
  }>;
  metrics: {
    highPriorityCount: number;
    totalCount: number;
    unreadMessagesCount: number;
  };
  notifications: CoachNotificationItem[];
};

export type CoachDashboardData = {
  activityLogs: CoachActivity[];
  assignments: CoachAssignmentSummary[];
  attentionItems: CoachDashboardAttentionItem[];
  calendarEvents: CoachCalendarEvent[];
  coachees: CoachCoacheeSummary[];
  metrics: {
    activeCoacheesCount: number;
    averageScore: number;
    attentionCount: number;
    blockedLearningPathsCount: number;
    lateAssignmentsCount: number;
    pendingCorrectionsCount: number;
    unreadMessagesCount: number;
  };
};

export type CoachCoacheeDetail = {
  goals: Array<{
    createdAt: string;
    dueDate: string | null;
    id: string;
    status: string;
    title: string;
  }>;
  notes: Array<{
    createdAt: string;
    id: string;
    note: string;
  }>;
  profile: CoachCoacheeSummary;
  progress: Array<{
    assignmentDescription: string;
    assignmentTitle: string;
    deadline: string;
    id: string;
    status: AssignmentStatus;
  }>;
  quizAttempts: Array<{
    id: string;
    percentage: number;
    quizTitle: string;
    status: QuizAttemptStatus;
    submittedAt: string;
  }>;
  reminders: Array<{
    action: string;
    createdAt: string;
    id: string;
    messageId: string | null;
    reason: string;
    title: string;
    type: string;
  }>;
};

export type CoachCohortSummary = {
  description: string;
  endDate: string | null;
  id: string;
  memberCount: number;
  name: string;
  progress: number;
  scoreAverage: number;
  startDate: string | null;
};

export type CoachCohortDetail = CoachCohortSummary & {
  assignments: CoachAssignmentSummary[];
  availableCoachees: CoachCoacheeSummary[];
  members: CoachCoacheeSummary[];
};

export type CoachTheme = {
  description: string;
  id: string;
  title: string;
};

export type CoachSubtheme = {
  description: string;
  id: string;
  themeId: string;
  title: string;
};

export type CoachContent = {
  body: string;
  description: string;
  externalUrl: string;
  fileUrl: string;
  id: string;
  status: ContentStatus;
  subthemeId: string;
  subthemeTitle: string;
  tags: string[];
  themeId: string;
  themeTitle: string;
  title: string;
  type: ContentType;
  updatedAt: string;
  videoUrl: string;
};

export type CoachLibraryData = {
  contents: CoachContent[];
  subthemes: CoachSubtheme[];
  themes: CoachTheme[];
};

export type CoachContentEditorData = CoachLibraryData & {
  content: CoachContent | null;
};

export type CoachAssignmentsData = {
  assignments: CoachAssignmentSummary[];
  metrics: {
    dueThisWeekCount: number;
    lateCount: number;
    pendingCorrectionsCount: number;
    totalCount: number;
  };
};

export type CoachAssignmentComposerData = {
  coachees: CoachCoacheeSummary[];
  cohorts: CoachCohortSummary[];
  contents: Array<Pick<CoachContent, "id" | "status" | "title" | "type">>;
  quizzes: CoachQuizOption[];
};

type CoachBaseData = {
  activityLogs: ActivityLogRow[];
  assignmentProgress: AssignmentProgressRow[];
  assignments: AssignmentRow[];
  authUsersById: Map<string, AuthUserSummary>;
  calendarEvents: CalendarEventRow[];
  coachNotes: CoachNoteRow[];
  cohortMembers: CohortMemberRow[];
  cohorts: CohortRow[];
  contents: ContentRow[];
  currentUserId: string;
  isAdmin: boolean;
  profiles: ProfileRow[];
  quizAttempts: QuizAttemptRow[];
  quizzes: QuizRow[];
  subthemes: SubthemeRow[];
  themes: ThemeRow[];
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

function compactText(value: string, maxLength = 88) {
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

function percentCompleted(progressRows: AssignmentProgressRow[]) {
  if (!progressRows.length) {
    return 0;
  }

  const completed = progressRows.filter((row) => row.status === "completed").length;

  return Math.round((completed / progressRows.length) * 100);
}

function ensureDescription(value: string | null) {
  return value?.trim() || "Aucune description renseignée.";
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

async function fetchMembers(
  supabase: SupabaseServerClient,
  cohortIds: string[],
) {
  if (!cohortIds.length) {
    return [];
  }

  return getRows<CohortMemberRow>(
    supabase
      .from("cohort_members")
      .select("id,cohort_id,user_id,created_at")
      .in("cohort_id", cohortIds),
  );
}

async function fetchProfiles(
  supabase: SupabaseServerClient,
  userIds: string[],
  isAdmin: boolean,
) {
  const query = supabase
    .from("profiles")
    .select("id,user_id,full_name,role,avatar_url,created_at")
    .eq("role", "coachee")
    .order("full_name", { ascending: true });

  if (!isAdmin) {
    if (!userIds.length) {
      return [];
    }

    return getRows<ProfileRow>(query.in("user_id", userIds));
  }

  return getRows<ProfileRow>(query);
}

async function fetchProgress(
  supabase: SupabaseServerClient,
  assignmentIds: string[],
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
      .in("assignment_id", assignmentIds),
  );
}

async function fetchQuizAttempts(
  supabase: SupabaseServerClient,
  userIds: string[],
) {
  if (!userIds.length) {
    return [];
  }

  return getRows<QuizAttemptRow>(
    supabase
      .from("quiz_attempts")
      .select(
        "id,quiz_id,assignment_id,user_id,score_obtained,score_max,percentage,status,passed,submitted_at,corrected_at,created_at",
      )
      .in("user_id", userIds),
  );
}

async function fetchQuizQuestions(
  supabase: SupabaseServerClient,
  quizIds: string[],
) {
  if (!quizIds.length) {
    return [];
  }

  return getRows<QuizQuestionRow>(
    supabase
      .from("quiz_questions")
      .select(
        "id,quiz_id,question_text,question_type,points,position,explanation,created_at",
      )
      .in("quiz_id", quizIds)
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

async function fetchQuizAnswers(
  supabase: SupabaseServerClient,
  attemptIds: string[],
) {
  if (!attemptIds.length) {
    return [];
  }

  return getRows<QuizAnswerRow>(
    supabase
      .from("quiz_answers")
      .select(
        "id,attempt_id,question_id,answer_text,selected_option_ids,points_obtained,is_correct,needs_manual_correction,coach_feedback,corrected_by,corrected_at",
      )
      .in("attempt_id", attemptIds),
  );
}

async function fetchCoachNotes(
  supabase: SupabaseServerClient,
  userIds: string[],
) {
  if (!userIds.length) {
    return [];
  }

  return getRows<CoachNoteRow>(
    supabase
      .from("coach_notes")
      .select("id,coach_id,coachee_id,note,created_at")
      .in("coachee_id", userIds)
      .order("created_at", { ascending: false }),
  );
}

async function fetchActivityLogs(
  supabase: SupabaseServerClient,
  userIds: string[],
  limit = 8,
) {
  if (!userIds.length) {
    return [];
  }

  return getRows<ActivityLogRow>(
    supabase
      .from("activity_logs")
      .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
      .in("user_id", userIds)
      .order("created_at", { ascending: false })
      .limit(limit),
  );
}

async function fetchDashboardUnreadMessages(
  supabase: SupabaseServerClient,
  payload: {
    currentUserId: string;
    limit?: number;
    senderIds: string[];
  },
): Promise<DashboardUnreadMessages> {
  if (!payload.senderIds.length) {
    return {
      count: 0,
      latest: [],
    };
  }

  const { count, data, error } = await supabase
    .from("messages")
    .select("id,sender_id,body,created_at", { count: "exact" })
    .eq("receiver_id", payload.currentUserId)
    .is("read_at", null)
    .in("sender_id", payload.senderIds)
    .order("created_at", { ascending: false })
    .limit(payload.limit ?? 5);

  if (error) {
    throw new Error(error.message);
  }

  return {
    count: count ?? (data ?? []).length,
    latest: (data ?? []) as DashboardUnreadMessageRow[],
  };
}

async function fetchCoacheeReminderLogs(
  supabase: SupabaseServerClient,
  payload: {
    coacheeId: string;
    currentUserId: string;
    isAdmin: boolean;
  },
) {
  let query = supabase
    .from("activity_logs")
    .select("id,user_id,action,entity_type,entity_id,metadata,created_at")
    .eq("entity_type", "message")
    .contains("metadata", { coacheeId: payload.coacheeId })
    .order("created_at", { ascending: false })
    .limit(8);

  if (!payload.isAdmin) {
    query = query.eq("user_id", payload.currentUserId);
  }

  return getRows<ActivityLogRow>(query);
}

async function fetchAuthUsersById(userIds: string[]) {
  const filteredIds = unique(userIds);

  if (!filteredIds.length) {
    return new Map<string, AuthUserSummary>();
  }

  try {
    const usersToKeep = new Set(filteredIds);
    const adminSupabase = createServiceSupabaseClient();
    const { data, error } = await adminSupabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (error) {
      console.error("Supabase Auth Admin listUsers failed:", error.message);
      return new Map<string, AuthUserSummary>();
    }

    return new Map(
      data.users
        .filter((user) => usersToKeep.has(user.id))
        .map((user) => [
          user.id,
          {
            email: user.email ?? "Email non disponible",
            lastSignInAt: user.last_sign_in_at ?? null,
          },
        ]),
    );
  } catch (error) {
    console.error("Supabase Auth Admin unavailable:", error);
    return new Map<string, AuthUserSummary>();
  }
}

function createAssignmentMapper(base: CoachBaseData) {
  const contentsById = new Map(base.contents.map((content) => [content.id, content]));
  const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
  const coacheesById = new Map(
    buildCoacheeSummaries(base).map((coachee) => [coachee.id, coachee]),
  );
  const cohortsById = new Map(base.cohorts.map((cohort) => [cohort.id, cohort]));

  return function mapAssignment(assignment: AssignmentRow): CoachAssignmentSummary {
    const contentTitle = assignment.content_id
      ? contentsById.get(assignment.content_id)?.title
      : assignment.quiz_id
        ? quizzesById.get(assignment.quiz_id)?.title
        : null;
    const targetLabel = assignment.assigned_to_user_id
      ? coacheesById.get(assignment.assigned_to_user_id)?.fullName
      : assignment.assigned_to_cohort_id
        ? cohortsById.get(assignment.assigned_to_cohort_id)?.name
        : null;

    return {
      contentTitle: contentTitle ?? "Ressource non renseignée",
      createdAt: assignment.created_at,
      deadline: assignment.deadline,
      description: ensureDescription(assignment.description),
      id: assignment.id,
      instructions: assignment.instructions ?? "",
      priority: assignment.priority,
      status: assignment.status,
      targetLabel: targetLabel ?? "Cible non renseignée",
      title: assignment.title,
      type: assignment.assignment_type,
    };
  };
}

function mapContent(
  content: ContentRow,
  themesById: Map<string, ThemeRow>,
  subthemesById: Map<string, SubthemeRow>,
): CoachContent {
  return {
    body: content.body ?? "",
    description: content.description ?? "",
    externalUrl: content.external_url ?? "",
    fileUrl: content.file_url ?? "",
    id: content.id,
    status: content.status,
    subthemeId: content.subtheme_id ?? "",
    subthemeTitle: content.subtheme_id
      ? subthemesById.get(content.subtheme_id)?.title ?? "Sous-thème supprimé"
      : "Sans sous-thème",
    tags: content.tags ?? [],
    themeId: content.theme_id ?? "",
    themeTitle: content.theme_id
      ? themesById.get(content.theme_id)?.title ?? "Thème supprimé"
      : "Sans thème",
    title: content.title,
    type: content.type,
    updatedAt: content.updated_at,
    videoUrl: content.video_url ?? "",
  };
}

function mapQuizQuestions(
  questions: QuizQuestionRow[],
  optionsByQuestion: Map<string, QuizOptionRow[]>,
): CoachQuizQuestion[] {
  return questions
    .toSorted((a, b) => a.position - b.position)
    .map((question) => ({
      explanation: question.explanation ?? "",
      id: question.id,
      options: (optionsByQuestion.get(question.id) ?? [])
        .toSorted((a, b) => a.position - b.position)
        .map((option) => ({
          id: option.id,
          isCorrect: option.is_correct,
          optionText: option.option_text,
          position: option.position,
        })),
      points: Number(question.points),
      position: question.position,
      questionText: question.question_text,
      questionType: question.question_type,
    }));
}

function mapQuiz(
  quiz: QuizRow,
  contentsById: Map<string, ContentRow>,
  questionsByQuiz: Map<string, QuizQuestionRow[]>,
  optionsByQuestion: Map<string, QuizOptionRow[]>,
  base: Pick<CoachBaseData, "currentUserId" | "isAdmin">,
): CoachQuiz {
  return {
    contentId: quiz.content_id ?? "",
    contentTitle: quiz.content_id
      ? contentsById.get(quiz.content_id)?.title ?? "Contenu supprimé"
      : "Sans contenu lié",
    createdAt: quiz.created_at,
    description: quiz.description ?? "",
    id: quiz.id,
    isOwner: base.isAdmin || quiz.created_by === base.currentUserId,
    passingScore: Number(quiz.passing_score),
    questions: mapQuizQuestions(questionsByQuiz.get(quiz.id) ?? [], optionsByQuestion),
    title: quiz.title,
    updatedAt: quiz.updated_at,
  };
}

function buildCoacheeSummaries(base: CoachBaseData): CoachCoacheeSummary[] {
  const progressByUser = groupBy(base.assignmentProgress, (row) => row.user_id);
  const attemptsByUser = groupBy(base.quizAttempts, (row) => row.user_id);

  return base.profiles.map((profile) => {
    const progressRows = progressByUser.get(profile.user_id) ?? [];
    const attempts = attemptsByUser.get(profile.user_id) ?? [];
    const authUser = base.authUsersById.get(profile.user_id);

    return {
      email: authUser?.email ?? "Email non disponible",
      fullName: profile.full_name,
      id: profile.user_id,
      lastActiveAt: authUser?.lastSignInAt ?? profile.created_at,
      lateAssignmentsCount: progressRows.filter(
        (row) => row.status === "late" || row.is_late,
      ).length,
      pendingCorrectionsCount: attempts.filter(
        (attempt) => attempt.status === "pending_correction",
      ).length,
      progress: percentCompleted(progressRows),
      scoreAverage: average(attempts.map((attempt) => attempt.percentage)),
    };
  });
}

function buildCohortSummaries(base: CoachBaseData): CoachCohortSummary[] {
  const membersByCohort = groupBy(base.cohortMembers, (row) => row.cohort_id);
  const progressByAssignment = groupBy(
    base.assignmentProgress,
    (row) => row.assignment_id,
  );

  return base.cohorts.map((cohort) => {
    const members = membersByCohort.get(cohort.id) ?? [];
    const memberIds = new Set(members.map((member) => member.user_id));
    const cohortAssignments = base.assignments.filter(
      (assignment) => assignment.assigned_to_cohort_id === cohort.id,
    );
    const progressRows = cohortAssignments.flatMap(
      (assignment) => progressByAssignment.get(assignment.id) ?? [],
    );
    const attempts = base.quizAttempts.filter((attempt) =>
      memberIds.has(attempt.user_id),
    );

    return {
      description: ensureDescription(cohort.description),
      endDate: cohort.end_date,
      id: cohort.id,
      memberCount: members.length,
      name: cohort.name,
      progress: percentCompleted(progressRows),
      scoreAverage: average(attempts.map((attempt) => attempt.percentage)),
      startDate: cohort.start_date,
    };
  });
}

const getCoachBaseData = cache(async (): Promise<CoachBaseData> => {
  const currentUser = await requireRole(["admin", "coach"]);
  const supabase = await createServerSupabaseClient();
  const isAdmin = currentUser.role === "admin";

  const cohortQuery = supabase
    .from("cohorts")
    .select("id,name,description,start_date,end_date,coach_id,created_at")
    .order("created_at", { ascending: false });
  const assignmentQuery = supabase
    .from("assignments")
    .select(
      "id,title,description,assignment_type,content_id,quiz_id,assigned_to_user_id,assigned_to_cohort_id,assigned_by,deadline,priority,status,instructions,created_at",
    )
    .order("created_at", { ascending: false });
  const contentQuery = supabase
    .from("contents")
    .select(
      "id,title,description,type,body,video_url,external_url,file_url,theme_id,subtheme_id,status,tags,created_by,updated_at",
    )
    .order("updated_at", { ascending: false });
  const eventQuery = supabase
    .from("calendar_events")
    .select(
      "id,title,description,start_time,end_time,type,coach_id,coachee_id,cohort_id,status",
    )
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(8);

  if (!isAdmin) {
    cohortQuery.eq("coach_id", currentUser.user.id);
    assignmentQuery.eq("assigned_by", currentUser.user.id);
    contentQuery.eq("created_by", currentUser.user.id);
    eventQuery.eq("coach_id", currentUser.user.id);
  }

  const [cohorts, assignments, contents, themes, subthemes, quizzes, calendarEvents] =
    await Promise.all([
      getRows<CohortRow>(cohortQuery),
      getRows<AssignmentRow>(assignmentQuery),
      getRows<ContentRow>(contentQuery),
      getRows<ThemeRow>(
        supabase
          .from("themes")
          .select("id,title,description,created_by")
          .order("title", { ascending: true }),
      ),
      getRows<SubthemeRow>(
        supabase
          .from("subthemes")
          .select("id,theme_id,title,description")
          .order("title", { ascending: true }),
      ),
      getRows<QuizRow>(
        supabase
          .from("quizzes")
          .select(
            "id,title,description,content_id,passing_score,created_by,created_at,updated_at",
          )
          .order("title", { ascending: true }),
      ),
      getRows<CalendarEventRow>(eventQuery),
    ]);

  const cohortMembers = await fetchMembers(
    supabase,
    cohorts.map((cohort) => cohort.id),
  );
  const scopedCoacheeIds = unique([
    ...cohortMembers.map((member) => member.user_id),
    ...assignments.map((assignment) => assignment.assigned_to_user_id),
  ]);
  const profiles = await fetchProfiles(supabase, scopedCoacheeIds, isAdmin);
  const profileUserIds = profiles.map((profile) => profile.user_id);

  const [
    assignmentProgress,
    quizAttempts,
    coachNotes,
    activityLogs,
    authUsersById,
  ] = await Promise.all([
    fetchProgress(
      supabase,
      assignments.map((assignment) => assignment.id),
    ),
    fetchQuizAttempts(supabase, profileUserIds),
    fetchCoachNotes(supabase, profileUserIds),
    fetchActivityLogs(supabase, profileUserIds),
    fetchAuthUsersById(profileUserIds),
  ]);

  return {
    activityLogs,
    assignmentProgress,
    assignments,
    authUsersById,
    calendarEvents,
    coachNotes,
    cohortMembers,
    cohorts,
    contents,
    currentUserId: currentUser.user.id,
    isAdmin,
    profiles,
    quizAttempts,
    quizzes,
    subthemes,
    themes,
  };
});

function buildDashboardAttentionItems({
  base,
  pathData,
  unreadMessages,
}: {
  base: CoachBaseData;
  pathData: CoachLearningPathData;
  unreadMessages: DashboardUnreadMessages;
}): CoachDashboardAttentionItem[] {
  const profileByUserId = new Map(
    base.profiles.map((profile) => [profile.user_id, profile]),
  );
  const quizById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
  const assignmentById = new Map(
    base.assignments.map((assignment) => [assignment.id, assignment]),
  );
  const pendingCorrections = base.quizAttempts.filter(
    (attempt) => attempt.status === "pending_correction",
  );
  const lateProgress = base.assignmentProgress.filter(
    (row) => row.status === "late" || row.is_late,
  );
  const latestMessage = unreadMessages.latest[0];
  const latestCorrection = pendingCorrections.toSorted((first, second) => {
    const firstTime =
      new Date(first.submitted_at ?? first.created_at).getTime() || 0;
    const secondTime =
      new Date(second.submitted_at ?? second.created_at).getTime() || 0;

    return secondTime - firstTime;
  })[0];
  const latestLateProgress = lateProgress.toSorted((first, second) => {
    const firstTime = new Date(first.updated_at).getTime() || 0;
    const secondTime = new Date(second.updated_at).getTime() || 0;

    return secondTime - firstTime;
  })[0];
  const topBlockedPath = pathData.signals.blockedLearners[0];
  const items: CoachDashboardAttentionItem[] = [];

  if (unreadMessages.count > 0) {
    const senderName = latestMessage
      ? profileByUserId.get(latestMessage.sender_id)?.full_name
      : null;

    items.push({
      count: unreadMessages.count,
      description: latestMessage
        ? `${senderName ?? "Coaché"} : ${compactText(latestMessage.body)}`
        : "Des conversations attendent une réponse.",
      href: "/coach/messages",
      id: "message",
      label: "Messages",
      title: "Messages non lus",
    });
  }

  if (pendingCorrections.length > 0) {
    const coacheeName = latestCorrection
      ? profileByUserId.get(latestCorrection.user_id)?.full_name
      : null;
    const quizTitle = latestCorrection
      ? quizById.get(latestCorrection.quiz_id)?.title
      : null;

    items.push({
      count: pendingCorrections.length,
      description:
        latestCorrection && quizTitle
          ? `${coacheeName ?? "Coaché"} · ${quizTitle}`
          : "Des réponses ouvertes attendent une correction.",
      href: "/coach/corrections",
      id: "correction",
      label: "Corrections",
      title: "Corrections en attente",
    });
  }

  if (pathData.metrics.blockedLearnersCount > 0) {
    items.push({
      count: pathData.metrics.blockedLearnersCount,
      description: topBlockedPath
        ? `${topBlockedPath.coacheeName} · ${topBlockedPath.pathTitle} · ${topBlockedPath.reason}`
        : "Des coachés sont bloqués dans un parcours.",
      href: "/coach/paths",
      id: "path_blocked",
      label: "Parcours",
      title: "Blocages parcours",
    });
  }

  if (lateProgress.length > 0) {
    const assignment = latestLateProgress
      ? assignmentById.get(latestLateProgress.assignment_id)
      : null;
    const coacheeName = latestLateProgress
      ? profileByUserId.get(latestLateProgress.user_id)?.full_name
      : null;

    items.push({
      count: lateProgress.length,
      description: assignment
        ? `${assignment.title} · ${coacheeName ?? "Coaché"}`
        : "Des assignations dépassent leur deadline.",
      href: "/coach/assignments",
      id: "late_assignment",
      label: "Retards",
      title: "Assignations en retard",
    });
  }

  return items;
}

function buildCoachNotifications({
  activityLogs,
  base,
  pathData,
  unreadMessages,
}: {
  activityLogs: ActivityLogRow[];
  base: CoachBaseData;
  pathData: CoachLearningPathData;
  unreadMessages: DashboardUnreadMessages;
}): CoachNotificationItem[] {
  const profileByUserId = new Map(
    base.profiles.map((profile) => [profile.user_id, profile]),
  );
  const quizById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
  const assignmentById = new Map(
    base.assignments.map((assignment) => [assignment.id, assignment]),
  );
  const messageNotifications = unreadMessages.latest.map((message) => ({
    category: "messages" as const,
    createdAt: message.created_at,
    description: compactText(message.body, 140),
    href: `/coach/messages?conversation=${message.sender_id}`,
    id: `message:${message.id}`,
    isUnread: true,
    priority: "high" as const,
    title: `Message de ${profileByUserId.get(message.sender_id)?.full_name ?? "Coaché"}`,
  }));
  const correctionNotifications = base.quizAttempts
    .filter((attempt) => attempt.status === "pending_correction")
    .map((attempt) => ({
      category: "corrections" as const,
      createdAt: attempt.submitted_at ?? attempt.created_at,
      description: `${profileByUserId.get(attempt.user_id)?.full_name ?? "Coaché"} · ${
        quizById.get(attempt.quiz_id)?.title ?? "Quiz"
      }`,
      href: "/coach/corrections",
      id: `correction:${attempt.id}`,
      isUnread: false,
      priority: "high" as const,
      title: "Correction en attente",
    }));
  const pathBlockedNotifications = pathData.paths.flatMap((path) =>
    (path.learnerProgress ?? [])
      .filter((learner) => learner.status === "blocked")
      .map((learner) => ({
        category: "paths" as const,
        createdAt: learner.lastActivityAt ?? path.createdAt,
        description: `${learner.fullName} · ${path.title} · ${learner.failedQuizCount} quiz à reprendre`,
        href: `/coach/coachees/${learner.userId}`,
        id: `path-blocked:${path.id}:${learner.userId}`,
        isUnread: false,
        priority: "high" as const,
        title: "Coaché bloqué dans un parcours",
      })),
  );
  const lateNotifications = base.assignmentProgress
    .filter((row) => row.status === "late" || row.is_late)
    .map((row) => {
      const assignment = assignmentById.get(row.assignment_id);

      return {
        category: "late" as const,
        createdAt: row.updated_at,
        description: `${profileByUserId.get(row.user_id)?.full_name ?? "Coaché"} · ${
          assignment?.title ?? "Assignation"
        }`,
        href: `/coach/coachees/${row.user_id}`,
        id: `late:${row.id}`,
        isUnread: false,
        priority: "normal" as const,
        title: "Assignation en retard",
      };
    });
  const activityNotifications = activityLogs.map((activity) => {
    const pathTitle = metadataText(activity.metadata, "learningPathTitle");
    const resourceTitle = metadataText(activity.metadata, "resourceTitle");
    const profile = profileByUserId.get(activity.user_id);
    const isPathActivity =
      activity.entity_type === "learning_path" ||
      activity.entity_type === "learning_path_item";

    return {
      category: (isPathActivity ? "paths" : "activity") as CoachNotificationCategory,
      createdAt: activity.created_at,
      description:
        resourceTitle ||
        pathTitle ||
        profile?.full_name ||
        "Activité enregistrée",
      href: isPathActivity ? `/coach/coachees/${activity.user_id}` : "/coach",
      id: `activity:${activity.id}`,
      isUnread: false,
      priority: "normal" as const,
      title: activity.action,
    };
  });
  const deduped = new Map<string, CoachNotificationItem>();

  [
    ...messageNotifications,
    ...correctionNotifications,
    ...pathBlockedNotifications,
    ...lateNotifications,
    ...activityNotifications,
  ].forEach((notification) => {
    deduped.set(notification.id, notification);
  });

  return [...deduped.values()]
    .toSorted((first, second) => {
      const priorityDelta =
        Number(second.priority === "high") - Number(first.priority === "high");

      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    })
    .slice(0, 80);
}

function buildCoachNotificationFilters(
  notifications: CoachNotificationItem[],
): CoachNotificationsData["filters"] {
  const countFor = (category: CoachNotificationCategory) =>
    notifications.filter((notification) => notification.category === category)
      .length;

  return [
    { count: notifications.length, id: "all", label: "Tout" },
    {
      count: countFor("messages"),
      id: "messages",
      label: "Messages",
    },
    {
      count: countFor("paths"),
      id: "paths",
      label: "Parcours",
    },
    {
      count: countFor("corrections"),
      id: "corrections",
      label: "Corrections",
    },
    {
      count: countFor("late"),
      id: "late",
      label: "Retards",
    },
    {
      count: countFor("activity"),
      id: "activity",
      label: "Activité",
    },
  ];
}

export const getCoachDashboardData =
  cache(async (): Promise<CoachDashboardData> => {
    const base = await getCoachBaseData();
    const supabase = await createServerSupabaseClient();
    const coachees = buildCoacheeSummaries(base);
    const mapAssignment = createAssignmentMapper(base);
    const assignments = base.assignments.slice(0, 6).map(mapAssignment);
    const [pathData, unreadMessages] = await Promise.all([
      getCoachLearningPathData(),
      fetchDashboardUnreadMessages(supabase, {
        currentUserId: base.currentUserId,
        senderIds: base.profiles.map((profile) => profile.user_id),
      }),
    ]);
    const attentionItems = buildDashboardAttentionItems({
      base,
      pathData,
      unreadMessages,
    });

    return {
      activityLogs: base.activityLogs.map((activity) => ({
        action: activity.action,
        createdAt: activity.created_at,
        entityType: activity.entity_type,
        id: activity.id,
      })),
      assignments,
      attentionItems,
      calendarEvents: base.calendarEvents.map((event) => ({
        endTime: event.end_time,
        id: event.id,
        startTime: event.start_time,
        status: event.status,
        title: event.title,
        type: event.type,
      })),
      coachees: coachees.slice(0, 5),
      metrics: {
        activeCoacheesCount: coachees.length,
        averageScore: average(
          base.quizAttempts.map((attempt) => attempt.percentage),
        ),
        attentionCount: attentionItems.reduce(
          (total, item) => total + item.count,
          0,
        ),
        blockedLearningPathsCount: pathData.metrics.blockedLearnersCount,
        lateAssignmentsCount: base.assignmentProgress.filter(
          (row) => row.status === "late" || row.is_late,
        ).length,
        pendingCorrectionsCount: base.quizAttempts.filter(
          (attempt) => attempt.status === "pending_correction",
        ).length,
        unreadMessagesCount: unreadMessages.count,
      },
    };
  });

export const getCoachNotificationsData =
  cache(async (): Promise<CoachNotificationsData> => {
    const base = await getCoachBaseData();
    const supabase = await createServerSupabaseClient();
    const profileUserIds = base.profiles.map((profile) => profile.user_id);
    const [
      activityLogs,
      enabledNotificationCategories,
      pathData,
      unreadMessages,
    ] = await Promise.all([
      fetchActivityLogs(supabase, profileUserIds, 40),
      getUserNotificationPreferenceCategories({
        role: "coach",
        userId: base.currentUserId,
      }),
      getCoachLearningPathData(),
      fetchDashboardUnreadMessages(supabase, {
        currentUserId: base.currentUserId,
        limit: 30,
        senderIds: profileUserIds,
      }),
    ]);
    const notifications = buildCoachNotifications({
      activityLogs,
      base,
      pathData,
      unreadMessages,
    });
    const highPriorityCount = notifications.filter(
      (notification) => notification.priority === "high",
    ).length;

    return {
      enabledNotificationCategories:
        enabledNotificationCategories as CoachNotificationCategory[],
      filters: buildCoachNotificationFilters(notifications),
      metrics: {
        highPriorityCount,
        totalCount: notifications.length,
        unreadMessagesCount: unreadMessages.count,
      },
      notifications,
    };
  });

export const getCoachCoachees = cache(async () => {
  const base = await getCoachBaseData();

  return buildCoacheeSummaries(base);
});

export const getCoachCoacheesData = cache(async (): Promise<CoachCoacheesData> => {
  const base = await getCoachBaseData();
  const supabase = await createServerSupabaseClient();
  let templatesQuery = supabase
    .from("reminder_templates")
    .select("id,title,body")
    .order("created_at", { ascending: false });

  if (!base.isAdmin) {
    templatesQuery = templatesQuery.eq("coach_id", base.currentUserId);
  }

  const templates = (await getRows<{
    body: string;
    id: string;
    title: string;
  }>(templatesQuery))
    .map((template) => {
      const parsedTitle = parseReminderTemplateTitle(template.title);

      return {
        body: template.body,
        id: template.id,
        title: parsedTitle.title,
        usage: parsedTitle.usage,
      };
    })
    .filter((template) => template.usage === "general");

  return {
    coachees: buildCoacheeSummaries(base),
    reminderTemplates: templates,
  };
});

export const getCoachCoacheeDetail = cache(
  async (coacheeId: string): Promise<CoachCoacheeDetail | null> => {
    const base = await getCoachBaseData();
    const profile = buildCoacheeSummaries(base).find(
      (coachee) => coachee.id === coacheeId,
    );

    if (!profile) {
      return null;
    }

    const assignmentsById = new Map(
      base.assignments.map((assignment) => [assignment.id, assignment]),
    );
    const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
    const supabase = await createServerSupabaseClient();
    let goalsQuery = supabase
      .from("coachee_goals")
      .select("id,coach_id,coachee_id,title,status,due_date,created_at")
      .eq("coachee_id", coacheeId)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (!base.isAdmin) {
      goalsQuery = goalsQuery.eq("coach_id", base.currentUserId);
    }

    const [goals, reminderLogs] = await Promise.all([
      getRows<CoacheeGoalRow>(goalsQuery),
      fetchCoacheeReminderLogs(supabase, {
        coacheeId,
        currentUserId: base.currentUserId,
        isAdmin: base.isAdmin,
      }),
    ]);

    return {
      goals: goals.map((goal) => ({
        createdAt: goal.created_at,
        dueDate: goal.due_date,
        id: goal.id,
        status: goal.status,
        title: goal.title,
      })),
      notes: base.coachNotes
        .filter((note) => note.coachee_id === coacheeId)
        .map((note) => ({
          createdAt: note.created_at,
          id: note.id,
          note: note.note,
        })),
      profile,
      progress: base.assignmentProgress
        .filter((row) => row.user_id === coacheeId)
        .map((row) => {
          const assignment = assignmentsById.get(row.assignment_id);

          return {
            assignmentDescription: ensureDescription(
              assignment?.description ?? null,
            ),
            assignmentTitle: assignment?.title ?? "Assignation supprimée",
            deadline: assignment?.deadline ?? row.updated_at,
            id: row.id,
            status: row.status,
          };
        }),
      quizAttempts: base.quizAttempts
        .filter((attempt) => attempt.user_id === coacheeId)
        .map((attempt) => ({
          id: attempt.id,
          percentage: attempt.percentage,
          quizTitle: quizzesById.get(attempt.quiz_id)?.title ?? "Quiz supprimé",
          status: attempt.status,
          submittedAt: attempt.submitted_at ?? attempt.created_at,
        })),
      reminders: reminderLogs.map((reminder) => ({
        action: reminder.action,
        createdAt: reminder.created_at,
        id: reminder.id,
        messageId: reminder.entity_id,
        reason: metadataText(reminder.metadata, "reason"),
        title:
          metadataText(reminder.metadata, "learningPathTitle") ||
          metadataText(reminder.metadata, "reminderTitle") ||
          "Relance",
        type: metadataText(reminder.metadata, "reminderType", "message"),
      })),
    };
  },
);

export const getCoachCohorts = cache(async () => {
  const base = await getCoachBaseData();

  return buildCohortSummaries(base);
});

export const getCoachCohortDetail = cache(
  async (cohortId: string): Promise<CoachCohortDetail | null> => {
    const base = await getCoachBaseData();
    const cohort = buildCohortSummaries(base).find((item) => item.id === cohortId);

    if (!cohort) {
      return null;
    }

    const coachees = buildCoacheeSummaries(base);
    const coacheesById = new Map(
      coachees.map((coachee) => [coachee.id, coachee]),
    );
    const cohortMembers = base.cohortMembers.filter(
      (member) => member.cohort_id === cohortId,
    );
    const memberIds = new Set(cohortMembers.map((member) => member.user_id));
    const mapAssignment = createAssignmentMapper(base);

    return {
      ...cohort,
      assignments: base.assignments
        .filter((assignment) => assignment.assigned_to_cohort_id === cohortId)
        .map(mapAssignment),
      availableCoachees: coachees.filter((coachee) => !memberIds.has(coachee.id)),
      members: cohortMembers
        .map((member) => coacheesById.get(member.user_id))
        .filter(Boolean) as CoachCoacheeSummary[],
    };
  },
);

export const getCoachLibraryData = cache(async (): Promise<CoachLibraryData> => {
  const base = await getCoachBaseData();
  const themesById = new Map(base.themes.map((theme) => [theme.id, theme]));
  const subthemesById = new Map(
    base.subthemes.map((subtheme) => [subtheme.id, subtheme]),
  );

  return {
    contents: base.contents.map((content) =>
      mapContent(content, themesById, subthemesById),
    ),
    subthemes: base.subthemes.map((subtheme) => ({
      description: subtheme.description ?? "",
      id: subtheme.id,
      themeId: subtheme.theme_id,
      title: subtheme.title,
    })),
    themes: base.themes.map((theme) => ({
      description: theme.description ?? "",
      id: theme.id,
      title: theme.title,
    })),
  };
});

export const getCoachContentEditorData = cache(
  async (contentId?: string): Promise<CoachContentEditorData> => {
    const library = await getCoachLibraryData();

    return {
      ...library,
      content: contentId
        ? library.contents.find((content) => content.id === contentId) ?? null
        : null,
    };
  },
);

export const getCoachAssignmentsData =
  cache(async (): Promise<CoachAssignmentsData> => {
    const base = await getCoachBaseData();
    const mapAssignment = createAssignmentMapper(base);
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    return {
      assignments: base.assignments.map(mapAssignment),
      metrics: {
        dueThisWeekCount: base.assignments.filter((assignment) => {
          const deadline = new Date(assignment.deadline);

          return deadline >= now && deadline <= nextWeek;
        }).length,
        lateCount: base.assignments.filter(
          (assignment) => assignment.status === "late",
        ).length,
        pendingCorrectionsCount: base.quizAttempts.filter(
          (attempt) => attempt.status === "pending_correction",
        ).length,
        totalCount: base.assignments.length,
      },
    };
  });

export const getCoachAssignmentComposerData =
  cache(async (): Promise<CoachAssignmentComposerData> => {
    const base = await getCoachBaseData();
    const themesById = new Map(base.themes.map((theme) => [theme.id, theme]));
    const subthemesById = new Map(
      base.subthemes.map((subtheme) => [subtheme.id, subtheme]),
    );

    return {
      coachees: buildCoacheeSummaries(base),
      cohorts: buildCohortSummaries(base),
      contents: base.contents.map((content) => {
        const mapped = mapContent(content, themesById, subthemesById);

        return {
          id: mapped.id,
          status: mapped.status,
          title: mapped.title,
          type: mapped.type,
        };
      }),
      quizzes: base.quizzes.map((quiz) => ({
        contentId: quiz.content_id ?? "",
        id: quiz.id,
        title: quiz.title,
      })),
    };
  });

async function getQuizGraph(base: CoachBaseData) {
  const supabase = await createServerSupabaseClient();
  const contentsById = new Map(base.contents.map((content) => [content.id, content]));
  const questions = await fetchQuizQuestions(
    supabase,
    base.quizzes.map((quiz) => quiz.id),
  );
  const options = await fetchQuizOptions(
    supabase,
    questions.map((question) => question.id),
  );
  const questionsByQuiz = groupBy(questions, (question) => question.quiz_id);
  const optionsByQuestion = groupBy(options, (option) => option.question_id);
  const quizzes = base.quizzes.map((quiz) =>
    mapQuiz(quiz, contentsById, questionsByQuiz, optionsByQuestion, base),
  );

  return {
    questions,
    quizzes,
  };
}

export const getCoachQuizzesData =
  cache(async (): Promise<CoachQuizzesData> => {
    const base = await getCoachBaseData();
    const { quizzes } = await getQuizGraph(base);
    const attemptsByQuiz = groupBy(base.quizAttempts, (attempt) => attempt.quiz_id);
    const assignmentsByQuiz = groupBy(
      base.assignments.filter((assignment) => assignment.quiz_id),
      (assignment) => assignment.quiz_id ?? "",
    );

    const summaries = quizzes.map((quiz) => {
      const attempts = attemptsByQuiz.get(quiz.id) ?? [];

      return {
        assignmentCount: assignmentsByQuiz.get(quiz.id)?.length ?? 0,
        averageScore: average(attempts.map((attempt) => attempt.percentage)),
        contentTitle: quiz.contentTitle,
        createdAt: quiz.createdAt,
        description: quiz.description,
        id: quiz.id,
        isOwner: quiz.isOwner,
        passingScore: quiz.passingScore,
        pendingCorrectionsCount: attempts.filter(
          (attempt) => attempt.status === "pending_correction",
        ).length,
        questionCount: quiz.questions.length,
        title: quiz.title,
        updatedAt: quiz.updatedAt,
      };
    });

    return {
      metrics: {
        averageScore: average(base.quizAttempts.map((attempt) => attempt.percentage)),
        pendingCorrectionsCount: base.quizAttempts.filter(
          (attempt) => attempt.status === "pending_correction",
        ).length,
        publishedQuizCount: summaries.filter((quiz) => quiz.questionCount > 0)
          .length,
        totalQuizCount: summaries.length,
      },
      quizzes: summaries,
    };
  });

export const getCoachQuizEditorData = cache(
  async (quizId?: string): Promise<CoachQuizEditorData> => {
    const base = await getCoachBaseData();
    const { quizzes } = await getQuizGraph(base);

    return {
      contents: base.contents.map((content) => ({
        id: content.id,
        status: content.status,
        title: content.title,
        type: content.type,
      })),
      quiz: quizId ? quizzes.find((quiz) => quiz.id === quizId) ?? null : null,
    };
  },
);

export const getCoachQuizResultsData =
  cache(async (): Promise<CoachQuizResultsData> => {
    const base = await getCoachBaseData();
    const coacheesById = new Map(
      buildCoacheeSummaries(base).map((coachee) => [coachee.id, coachee]),
    );
    const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));
    const assignmentsById = new Map(
      base.assignments.map((assignment) => [assignment.id, assignment]),
    );

    const results = base.quizAttempts
      .toSorted(
        (a, b) =>
          new Date(b.submitted_at ?? b.created_at).getTime() -
          new Date(a.submitted_at ?? a.created_at).getTime(),
      )
      .map((attempt) => {
        const coachee = coacheesById.get(attempt.user_id);
        const quiz = quizzesById.get(attempt.quiz_id);
        const assignment = attempt.assignment_id
          ? assignmentsById.get(attempt.assignment_id)
          : null;

        return {
          assignmentTitle: assignment?.title ?? "Hors assignation",
          coacheeEmail: coachee?.email ?? "Email non disponible",
          coacheeName: coachee?.fullName ?? "Coaché supprimé",
          correctedAt: attempt.corrected_at,
          id: attempt.id,
          passed: attempt.passed,
          percentage: Number(attempt.percentage),
          quizTitle: quiz?.title ?? "Quiz supprimé",
          scoreMax: Number(attempt.score_max),
          scoreObtained: Number(attempt.score_obtained),
          status: attempt.status,
          submittedAt: attempt.submitted_at ?? attempt.created_at,
        };
      });

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

export const getCoachCorrectionsData =
  cache(async (): Promise<CoachCorrectionsData> => {
    const base = await getCoachBaseData();
    const supabase = await createServerSupabaseClient();
    const pendingAttempts = base.quizAttempts.filter(
      (attempt) => attempt.status === "pending_correction",
    );
    const answers = (
      await fetchQuizAnswers(
        supabase,
        pendingAttempts.map((attempt) => attempt.id),
      )
    ).filter((answer) => answer.needs_manual_correction);
    const questionIds = unique(answers.map((answer) => answer.question_id));
    const questions = questionIds.length
      ? await getRows<QuizQuestionRow>(
          supabase
            .from("quiz_questions")
            .select(
              "id,quiz_id,question_text,question_type,points,position,explanation,created_at",
            )
            .in("id", questionIds),
        )
      : [];
    const coacheesById = new Map(
      buildCoacheeSummaries(base).map((coachee) => [coachee.id, coachee]),
    );
    const attemptsById = new Map(
      pendingAttempts.map((attempt) => [attempt.id, attempt]),
    );
    const questionsById = new Map(
      questions.map((question) => [question.id, question]),
    );
    const quizzesById = new Map(base.quizzes.map((quiz) => [quiz.id, quiz]));

    return {
      corrections: answers.map((answer) => {
        const attempt = attemptsById.get(answer.attempt_id);
        const question = questionsById.get(answer.question_id);
        const coachee = attempt ? coacheesById.get(attempt.user_id) : null;
        const quiz = attempt ? quizzesById.get(attempt.quiz_id) : null;

        return {
          answerId: answer.id,
          answerText: answer.answer_text ?? "Réponse vide.",
          attemptId: answer.attempt_id,
          coachFeedback: answer.coach_feedback ?? "",
          coacheeEmail: coachee?.email ?? "Email non disponible",
          coacheeName: coachee?.fullName ?? "Coaché supprimé",
          pointsMax: Number(question?.points ?? 0),
          pointsObtained: Number(answer.points_obtained),
          questionText: question?.question_text ?? "Question supprimée",
          quizTitle: quiz?.title ?? "Quiz supprimé",
          submittedAt: attempt?.submitted_at ?? attempt?.created_at ?? "",
        };
      }),
      metrics: {
        pendingAnswersCount: answers.length,
        pendingAttemptsCount: pendingAttempts.length,
      },
    };
  });
