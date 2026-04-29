import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Plus,
} from "lucide-react";
import { AssignmentComposerForm } from "@/components/coaching/assignment-composer-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/ui/stat-card";
import type {
  CoachAssignmentComposerData,
  CoachAssignmentsData,
} from "@/services/coach-service";
import { formatDate } from "@/utils/format";

export function AssignmentsPage({ data }: { data: CoachAssignmentsData }) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
            href="/coach/assignments/new"
          >
            <Plus className="h-4 w-4" />
            Créer une assignation
          </Link>
        }
        description="Suivez les contenus, quiz, deadlines, retards et relances."
        title="Assignations"
      />
      <div className="space-y-4 p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Assignations créées"
            icon={ClipboardCheck}
            label="Total"
            tone="emerald"
            value={String(data.metrics.totalCount)}
          />
          <StatCard
            helper="Deadlines dans les 7 jours"
            icon={Clock3}
            label="Cette semaine"
            tone="amber"
            value={String(data.metrics.dueThisWeekCount)}
          />
          <StatCard
            helper="À relancer"
            icon={AlertTriangle}
            label="En retard"
            tone="rose"
            value={String(data.metrics.lateCount)}
          />
          <StatCard
            helper="Questions ouvertes"
            icon={CalendarClock}
            label="À corriger"
            tone="indigo"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
        </section>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          {data.assignments.length ? (
            <div className="divide-y divide-slate-100">
              {data.assignments.map((assignment) => (
                <div
                  className="grid gap-4 p-5 lg:grid-cols-[1.2fr_170px_130px_130px_170px]"
                  key={assignment.id}
                >
                  <div>
                    <p className="font-semibold">{assignment.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {assignment.instructions || assignment.description}
                    </p>
                    <p className="mt-2 text-xs font-medium text-emerald-700">
                      {assignment.contentTitle}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    {assignment.targetLabel}
                  </p>
                  <StatusBadge status={assignment.status} />
                  <PriorityBadge priority={assignment.priority} />
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarClock className="h-4 w-4" />
                    {formatDate(assignment.deadline)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                action={
                  <Link
                    className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                    href="/coach/assignments/new"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une assignation
                  </Link>
                }
                description="Assignez un contenu, un quiz ou les deux à un coaché ou une cohorte."
                icon={ClipboardCheck}
                title="Aucune assignation"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export function AssignmentComposerPage({
  data,
}: {
  data: CoachAssignmentComposerData;
}) {
  return (
    <>
      <PageHeader
        description="Assignez un contenu, un quiz ou les deux à un coaché ou une cohorte."
        title="Nouvelle assignation"
      />
      <div className="p-6">
        <AssignmentComposerForm data={data} />
      </div>
    </>
  );
}
