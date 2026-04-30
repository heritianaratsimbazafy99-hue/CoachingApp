export type UserRole = "admin" | "coach" | "coachee";

export type ContentType = "document" | "external_link" | "quiz" | "text" | "video";
export type ContentStatus = "draft" | "published";
export type AssignmentStatus = "assigned" | "in_progress" | "completed" | "late";
export type AssignmentType = "content" | "content_quiz" | "path" | "quiz";
export type Priority = "high" | "normal";
export type QuestionType = "multiple_choice" | "open" | "single_choice";
export type QuizAttemptStatus = "failed" | "passed" | "pending_correction";
export type CalendarEventType =
  | "collective_workshop"
  | "individual_coaching"
  | "info_meeting"
  | "reminder";
export type CalendarEventStatus = "cancelled" | "done" | "scheduled";

export type NavItem = {
  href: string;
  icon: string;
  label: string;
};

export type AppShellAlertTone = "amber" | "indigo" | "rose" | "sky";

export type AppShellAlert = {
  count: number;
  href: string;
  label: string;
  title: string;
  tone: AppShellAlertTone;
};

export type AppShellSignals = {
  alerts: AppShellAlert[];
  navBadges: Partial<Record<string, number>>;
  notificationCount: number;
};

export type Profile = {
  avatarUrl?: string;
  email: string;
  fullName: string;
  id: string;
  lastActiveAt: string;
  role: UserRole;
};

export type Cohort = {
  coachId: string;
  description: string;
  endDate: string;
  id: string;
  memberIds: string[];
  name: string;
  progress: number;
  scoreAverage: number;
  startDate: string;
};

export type Theme = {
  description: string;
  id: string;
  title: string;
};

export type Subtheme = {
  description: string;
  id: string;
  themeId: string;
  title: string;
};

export type ContentItem = {
  body: string;
  createdBy: string;
  description: string;
  externalUrl?: string;
  fileUrl?: string;
  id: string;
  quizId?: string;
  status: ContentStatus;
  subthemeId: string;
  tags: string[];
  themeId: string;
  title: string;
  type: ContentType;
  updatedAt: string;
  videoUrl?: string;
};

export type QuizOption = {
  id: string;
  isCorrect: boolean;
  optionText: string;
};

export type QuizQuestion = {
  explanation: string;
  id: string;
  options: QuizOption[];
  points: number;
  position: number;
  questionText: string;
  questionType: QuestionType;
};

export type Quiz = {
  contentId?: string;
  createdBy: string;
  description: string;
  id: string;
  passingScore: number;
  questions: QuizQuestion[];
  title: string;
};

export type Assignment = {
  assignedBy: string;
  assignedToCohortId?: string;
  assignedToUserId?: string;
  assignmentType: AssignmentType;
  contentId?: string;
  createdAt: string;
  deadline: string;
  description: string;
  id: string;
  instructions: string;
  priority: Priority;
  quizId?: string;
  status: AssignmentStatus;
  title: string;
};

export type AssignmentProgress = {
  assignmentId: string;
  completedAt?: string;
  id: string;
  isLate: boolean;
  startedAt?: string;
  status: AssignmentStatus;
  userId: string;
};

export type QuizAttempt = {
  assignmentId?: string;
  correctedAt?: string;
  id: string;
  percentage: number;
  passed: boolean;
  quizId: string;
  scoreMax: number;
  scoreObtained: number;
  status: QuizAttemptStatus;
  submittedAt: string;
  userId: string;
};

export type Message = {
  body: string;
  createdAt: string;
  id: string;
  readAt?: string;
  receiverId: string;
  senderId: string;
};

export type CalendarEvent = {
  coachId: string;
  coacheeId?: string;
  cohortId?: string;
  description: string;
  endTime: string;
  id: string;
  startTime: string;
  status: CalendarEventStatus;
  title: string;
  type: CalendarEventType;
};

export type CoachNote = {
  coachId: string;
  coacheeId: string;
  createdAt: string;
  id: string;
  note: string;
};

export type ActivityLog = {
  action: string;
  createdAt: string;
  entityId: string;
  entityType: string;
  id: string;
  userId: string;
};
