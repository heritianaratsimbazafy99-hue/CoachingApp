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
  assigned: "border-sky-100 bg-sky-50 text-sky-700",
  completed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  draft: "border-slate-200 bg-slate-50 text-slate-600",
  failed: "border-rose-100 bg-rose-50 text-rose-700",
  in_progress: "border-amber-100 bg-amber-50 text-amber-700",
  late: "border-rose-100 bg-rose-50 text-rose-700",
  passed: "border-emerald-100 bg-emerald-50 text-emerald-700",
  pending_correction: "border-indigo-100 bg-indigo-50 text-indigo-700",
  published: "border-emerald-100 bg-emerald-50 text-emerald-700",
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
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
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        priority === "high"
          ? "border-orange-100 bg-orange-50 text-orange-700"
          : "border-slate-200 bg-slate-50 text-slate-600",
      )}
    >
      {priorityLabel[priority]}
    </span>
  );
}
