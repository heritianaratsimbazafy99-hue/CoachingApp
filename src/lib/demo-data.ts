import type {
  ActivityLog,
  Assignment,
  AssignmentProgress,
  CalendarEvent,
  CoachNote,
  Cohort,
  ContentItem,
  Message,
  Profile,
  Quiz,
  Subtheme,
  Theme,
} from "@/types/coaching";

export const profiles: Profile[] = [
  {
    email: "admin@coaching.test",
    fullName: "Admin Platform",
    id: "admin-1",
    lastActiveAt: "2026-04-29T08:30:00.000Z",
    role: "admin",
  },
  {
    email: "coach@coaching.test",
    fullName: "Miora Coach",
    id: "coach-1",
    lastActiveAt: "2026-04-29T09:10:00.000Z",
    role: "coach",
  },
  {
    email: "aina@coaching.test",
    fullName: "Aina Rakoto",
    id: "coachee-1",
    lastActiveAt: "2026-04-28T16:45:00.000Z",
    role: "coachee",
  },
  {
    email: "tiana@coaching.test",
    fullName: "Tiana Andry",
    id: "coachee-2",
    lastActiveAt: "2026-04-27T12:20:00.000Z",
    role: "coachee",
  },
  {
    email: "sara@coaching.test",
    fullName: "Sara Nomena",
    id: "coachee-3",
    lastActiveAt: "2026-04-26T14:15:00.000Z",
    role: "coachee",
  },
];

export const cohorts: Cohort[] = [
  {
    coachId: "coach-1",
    description: "Programme leadership pour managers juniors.",
    endDate: "2026-06-30",
    id: "cohort-1",
    memberIds: ["coachee-1", "coachee-2"],
    name: "Leadership Q2",
    progress: 64,
    scoreAverage: 78,
    startDate: "2026-04-01",
  },
  {
    coachId: "coach-1",
    description: "Parcours confiance et prise de parole.",
    endDate: "2026-07-15",
    id: "cohort-2",
    memberIds: ["coachee-3"],
    name: "Confiance orale",
    progress: 42,
    scoreAverage: 70,
    startDate: "2026-04-15",
  },
];

export const themes: Theme[] = [
  {
    description: "Posture, écoute active et confiance.",
    id: "theme-1",
    title: "Leadership personnel",
  },
  {
    description: "Préparation, clarté et impact à l'oral.",
    id: "theme-2",
    title: "Communication",
  },
];

export const subthemes: Subtheme[] = [
  {
    description: "Installer une relation claire et constructive.",
    id: "subtheme-1",
    themeId: "theme-1",
    title: "Posture de coaché",
  },
  {
    description: "Structurer un message simple et mémorable.",
    id: "subtheme-2",
    themeId: "theme-2",
    title: "Pitch et synthèse",
  },
];

export const contents: ContentItem[] = [
  {
    body: "Ce module introduit les trois piliers de la posture : intention, écoute et action. Prenez des notes sur les situations où vous perdez en clarté.",
    createdBy: "coach-1",
    description: "Un cours court pour clarifier sa posture avant un échange.",
    id: "content-1",
    quizId: "quiz-1",
    status: "published",
    subthemeId: "subtheme-1",
    tags: ["leadership", "posture"],
    themeId: "theme-1",
    title: "Clarifier sa posture de progression",
    type: "text",
    updatedAt: "2026-04-26T08:00:00.000Z",
  },
  {
    body: "Visionnez la vidéo, puis préparez une phrase d'ouverture de 30 secondes.",
    createdBy: "coach-1",
    description: "Vidéo guidée pour ouvrir une présentation sans se disperser.",
    id: "content-2",
    quizId: "quiz-2",
    status: "published",
    subthemeId: "subtheme-2",
    tags: ["oral", "pitch"],
    themeId: "theme-2",
    title: "Démarrer une prise de parole",
    type: "video",
    updatedAt: "2026-04-24T09:00:00.000Z",
    videoUrl: "https://example.com/video-demo",
  },
  {
    body: "Brouillon de ressource pour structurer un feedback en 4 temps.",
    createdBy: "coach-1",
    description: "Document de travail à publier après relecture.",
    id: "content-3",
    status: "draft",
    subthemeId: "subtheme-1",
    tags: ["feedback"],
    themeId: "theme-1",
    title: "Feedback utile et actionnable",
    type: "document",
    updatedAt: "2026-04-22T12:00:00.000Z",
  },
];

export const quizzes: Quiz[] = [
  {
    contentId: "content-1",
    createdBy: "coach-1",
    description: "Valide les bases du module posture.",
    id: "quiz-1",
    passingScore: 70,
    questions: [
      {
        explanation: "Une intention claire aide à formuler une action concrète.",
        id: "question-1",
        options: [
          { id: "option-1", isCorrect: true, optionText: "Intention" },
          { id: "option-2", isCorrect: false, optionText: "Improvisation" },
          { id: "option-3", isCorrect: false, optionText: "Distraction" },
        ],
        points: 5,
        position: 1,
        questionText: "Quel pilier aide à cadrer une action de coaching ?",
        questionType: "single_choice",
      },
      {
        explanation: "Les questions ouvertes encouragent l'analyse personnelle.",
        id: "question-2",
        options: [],
        points: 5,
        position: 2,
        questionText: "Décrivez une situation où votre posture peut progresser.",
        questionType: "open",
      },
    ],
    title: "Quiz posture de progression",
  },
  {
    contentId: "content-2",
    createdBy: "coach-1",
    description: "Mesure la compréhension d'un pitch court.",
    id: "quiz-2",
    passingScore: 75,
    questions: [
      {
        explanation: "Le message doit combiner clarté, contexte et appel à l'action.",
        id: "question-3",
        options: [
          { id: "option-4", isCorrect: true, optionText: "Clarté" },
          { id: "option-5", isCorrect: true, optionText: "Appel à l'action" },
          { id: "option-6", isCorrect: false, optionText: "Digression" },
        ],
        points: 10,
        position: 1,
        questionText: "Quels éléments renforcent un pitch court ?",
        questionType: "multiple_choice",
      },
    ],
    title: "Quiz prise de parole",
  },
];

export const assignments: Assignment[] = [
  {
    assignedBy: "coach-1",
    assignedToCohortId: "cohort-1",
    assignmentType: "content_quiz",
    contentId: "content-1",
    createdAt: "2026-04-20T08:00:00.000Z",
    deadline: "2026-05-03",
    description: "Lire le module et répondre au quiz associé.",
    id: "assignment-1",
    instructions: "Notez deux actions concrètes avant le quiz.",
    priority: "high",
    quizId: "quiz-1",
    status: "in_progress",
    title: "Posture de progression",
  },
  {
    assignedBy: "coach-1",
    assignedToUserId: "coachee-3",
    assignmentType: "quiz",
    createdAt: "2026-04-18T08:00:00.000Z",
    deadline: "2026-04-27",
    description: "Faire le quiz de prise de parole.",
    id: "assignment-2",
    instructions: "Répondez sans revenir à vos notes.",
    priority: "normal",
    quizId: "quiz-2",
    status: "late",
    title: "Quiz pitch court",
  },
  {
    assignedBy: "coach-1",
    assignedToUserId: "coachee-1",
    assignmentType: "content",
    contentId: "content-2",
    createdAt: "2026-04-25T08:00:00.000Z",
    deadline: "2026-05-07",
    description: "Regarder la vidéo et marquer le contenu comme terminé.",
    id: "assignment-3",
    instructions: "Préparez votre phrase d'ouverture.",
    priority: "normal",
    status: "assigned",
    title: "Démarrer une prise de parole",
  },
];

export const assignmentProgress: AssignmentProgress[] = [
  {
    assignmentId: "assignment-1",
    id: "progress-1",
    isLate: false,
    startedAt: "2026-04-21T08:00:00.000Z",
    status: "in_progress",
    userId: "coachee-1",
  },
  {
    assignmentId: "assignment-1",
    completedAt: "2026-04-28T14:00:00.000Z",
    id: "progress-2",
    isLate: false,
    startedAt: "2026-04-22T08:00:00.000Z",
    status: "completed",
    userId: "coachee-2",
  },
  {
    assignmentId: "assignment-2",
    id: "progress-3",
    isLate: true,
    startedAt: "2026-04-20T10:00:00.000Z",
    status: "late",
    userId: "coachee-3",
  },
];

export const quizAttempts = [
  {
    assignmentId: "assignment-1",
    id: "attempt-1",
    percentage: 80,
    passed: true,
    quizId: "quiz-1",
    scoreMax: 10,
    scoreObtained: 8,
    status: "passed" as const,
    submittedAt: "2026-04-28T14:10:00.000Z",
    userId: "coachee-2",
  },
  {
    assignmentId: "assignment-1",
    id: "attempt-2",
    percentage: 50,
    passed: false,
    quizId: "quiz-1",
    scoreMax: 10,
    scoreObtained: 5,
    status: "pending_correction" as const,
    submittedAt: "2026-04-29T09:20:00.000Z",
    userId: "coachee-1",
  },
];

export const messages: Message[] = [
  {
    body: "Bonjour Aina, pense à terminer le quiz avant vendredi.",
    createdAt: "2026-04-29T08:45:00.000Z",
    id: "message-1",
    receiverId: "coachee-1",
    senderId: "coach-1",
  },
  {
    body: "Merci, je bloque 30 minutes cet après-midi.",
    createdAt: "2026-04-29T08:50:00.000Z",
    id: "message-2",
    readAt: "2026-04-29T08:52:00.000Z",
    receiverId: "coach-1",
    senderId: "coachee-1",
  },
];

export const calendarEvents: CalendarEvent[] = [
  {
    coachId: "coach-1",
    coacheeId: "coachee-1",
    description: "Point individuel sur les objectifs de la semaine.",
    endTime: "2026-05-02T10:30:00.000Z",
    id: "event-1",
    startTime: "2026-05-02T10:00:00.000Z",
    status: "scheduled",
    title: "Coaching Aina",
    type: "individual_coaching",
  },
  {
    coachId: "coach-1",
    cohortId: "cohort-1",
    description: "Atelier collectif sur la posture de progression.",
    endTime: "2026-05-05T14:30:00.000Z",
    id: "event-2",
    startTime: "2026-05-05T13:30:00.000Z",
    status: "scheduled",
    title: "Atelier Leadership Q2",
    type: "collective_workshop",
  },
];

export const coachNotes: CoachNote[] = [
  {
    coachId: "coach-1",
    coacheeId: "coachee-1",
    createdAt: "2026-04-26T10:00:00.000Z",
    id: "note-1",
    note: "Aina progresse vite mais doit poser ses objectifs par écrit.",
  },
];

export const activityLogs: ActivityLog[] = [
  {
    action: "content_completed",
    createdAt: "2026-04-28T14:00:00.000Z",
    entityId: "content-1",
    entityType: "content",
    id: "activity-1",
    userId: "coachee-2",
  },
  {
    action: "quiz_submitted",
    createdAt: "2026-04-29T09:20:00.000Z",
    entityId: "quiz-1",
    entityType: "quiz",
    id: "activity-2",
    userId: "coachee-1",
  },
];

export const messageTemplates = [
  "Bonjour [Prénom], je vois que tu n'as pas encore terminé [Nom de l'assignation]. La deadline est prévue le [date]. N'hésite pas à me dire si tu as besoin d'aide.",
  "Bravo pour ta progression cette semaine. Continue avec le prochain module quand tu es disponible.",
  "Petit rappel : ton rendez-vous de coaching est prévu cette semaine. Prépare une question prioritaire.",
];

export function getProfile(id: string) {
  return profiles.find((profile) => profile.id === id);
}

export function getContent(id: string) {
  return contents.find((content) => content.id === id);
}

export function getQuiz(id: string) {
  return quizzes.find((quiz) => quiz.id === id);
}

export function getAssignment(id: string) {
  return assignments.find((assignment) => assignment.id === id);
}

export function getCohort(id: string) {
  return cohorts.find((cohort) => cohort.id === id);
}

export function getThemeTitle(id: string) {
  return themes.find((theme) => theme.id === id)?.title ?? "Sans thème";
}

export function getSubthemeTitle(id: string) {
  return (
    subthemes.find((subtheme) => subtheme.id === id)?.title ?? "Sans sous-thème"
  );
}

export function getCoacheeAssignments(userId: string) {
  const userCohortIds = cohorts
    .filter((cohort) => cohort.memberIds.includes(userId))
    .map((cohort) => cohort.id);

  return assignments.filter(
    (assignment) =>
      assignment.assignedToUserId === userId ||
      (assignment.assignedToCohortId &&
        userCohortIds.includes(assignment.assignedToCohortId)),
  );
}
