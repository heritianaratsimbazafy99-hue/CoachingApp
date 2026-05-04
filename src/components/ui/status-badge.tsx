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
  assigned: "border-sky-100 bg-sky-50 text-sky-700 ring-sky-100",
  completed: "border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100",
  draft: "border-slate-200 bg-slate-50 text-slate-600 ring-slate-100",
  failed: "border-rose-100 bg-rose-50 text-rose-700 ring-rose-100",
  in_progress: "border-amber-100 bg-amber-50 text-amber-700 ring-amber-100",
  late: "border-rose-100 bg-rose-50 text-rose-700 ring-rose-100",
  passed: "border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100",
  pending_correction: "border-indigo-100 bg-indigo-50 text-indigo-700 ring-indigo-100",
  published: "border-emerald-100 bg-emerald-50 text-emerald-700 ring-emerald-100",
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
        "inline-flex w-fit max-w-[11rem] shrink-0 items-center justify-center self-start justify-self-start overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ring-1 sm:max-w-[13rem]",
        statusStyles[status],
      )}
    >
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit max-w-[10rem] shrink-0 items-center justify-center self-start justify-self-start overflow-hidden rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ring-1",
        priority === "high"
          ? "border-orange-100 bg-orange-50 text-orange-700 ring-orange-100"
          : "border-slate-200 bg-slate-50 text-slate-600 ring-slate-100",
      )}
    >
      <span className="min-w-0 truncate">{priorityLabel[priority]}</span>
    </span>
  );
}
