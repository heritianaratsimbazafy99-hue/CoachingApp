import type {
  AssignmentStatus,
  CalendarEventType,
  ContentType,
  Priority,
  QuizAttemptStatus,
} from "@/types/coaching";

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value));
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export const contentTypeLabel: Record<ContentType, string> = {
  document: "Document",
  external_link: "Lien",
  quiz: "Quiz",
  text: "Cours texte",
  video: "Vidéo",
};

export const assignmentStatusLabel: Record<AssignmentStatus, string> = {
  assigned: "Assigné",
  completed: "Terminé",
  in_progress: "En cours",
  late: "En retard",
};

export const quizAttemptStatusLabel: Record<QuizAttemptStatus, string> = {
  failed: "Échoué",
  passed: "Réussi",
  pending_correction: "À corriger",
};

export const priorityLabel: Record<Priority, string> = {
  high: "Important",
  normal: "Normal",
};

export const eventTypeLabel: Record<CalendarEventType, string> = {
  collective_workshop: "Atelier collectif",
  individual_coaching: "Coaching individuel",
  info_meeting: "Meeting info",
  reminder: "Rappel",
};
