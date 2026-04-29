import type {
  AssignmentStatus,
  ContentStatus,
  Priority,
  QuizAttemptStatus,
} from "@/types/coaching";
import {
  assignmentStatusLabel,
  priorityLabel,
  quizAttemptStatusLabel,
} from "@/utils/format";
import { cn } from "@/utils/cn";

type StatusBadgeProps = {
  status: AssignmentStatus | ContentStatus | QuizAttemptStatus;
};

const statusStyles: Record<string, string> = {
  assigned: "border-blue-200 bg-blue-50 text-blue-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-red-200 bg-red-50 text-red-700",
  in_progress: "border-amber-200 bg-amber-50 text-amber-700",
  late: "border-red-200 bg-red-50 text-red-700",
  passed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending_correction: "border-purple-200 bg-purple-50 text-purple-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const label =
    status in assignmentStatusLabel
      ? assignmentStatusLabel[status as AssignmentStatus]
      : status in quizAttemptStatusLabel
        ? quizAttemptStatusLabel[status as QuizAttemptStatus]
        : status === "published"
          ? "Publié"
          : "Brouillon";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        priority === "high"
          ? "border-orange-200 bg-orange-50 text-orange-700"
          : "border-slate-200 bg-white text-slate-600",
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
