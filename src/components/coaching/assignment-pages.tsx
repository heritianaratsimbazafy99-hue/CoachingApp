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
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
          <Link className={buttonVariants()} href="/coach/assignments/new">
            <Plus className="h-4 w-4" />
            Créer une assignation
          </Link>
        }
        description="Suivez les contenus, quiz, deadlines, retards et relances."
        title="Assignations"
      />
      <div className="space-y-4 p-4 sm:p-6">
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

        <Card className="overflow-hidden">
          <CardHeader className="flex items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle>Liste des assignations</CardTitle>
              <CardDescription>
                Priorités, échéances et cible opérationnelle.
              </CardDescription>
            </div>
            <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
              {data.assignments.length} assignation(s)
            </span>
          </CardHeader>
          {data.assignments.length ? (
            <div className="divide-y divide-slate-100">
              {data.assignments.map((assignment) => (
                <div
                  className="grid gap-4 p-5 transition hover:bg-sky-50/35 lg:grid-cols-[minmax(0,1fr)_220px_230px] [contain-intrinsic-size:170px] [content-visibility:auto]"
                  key={assignment.id}
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-950">
                      {assignment.title}
                    </p>
                    <p className="mt-1 break-words text-sm leading-6 text-slate-500">
                      {assignment.instructions || assignment.description}
                    </p>
                    <p className="mt-3 inline-flex max-w-full break-words rounded-lg border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                      {assignment.contentTitle}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 ring-1 ring-white">
                    <p className="text-xs font-semibold text-slate-400">
                      Cible
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {assignment.targetLabel}
                    </p>
                  </div>

                  <div className="grid gap-3 rounded-xl border border-slate-200/80 bg-white p-3 ring-1 ring-white sm:grid-cols-3 lg:grid-cols-1">
                    <div className="flex flex-wrap items-start gap-2">
                      <StatusBadge status={assignment.status} />
                      <PriorityBadge priority={assignment.priority} />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200/80">
                      <CalendarClock className="h-4 w-4 text-sky-600" />
                      {formatDate(assignment.deadline)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6">
              <EmptyState
                action={
                  <Link
                    className={buttonVariants()}
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
        </Card>
      </div>
    </>
  );
}

export function AssignmentComposerPage({
  data,
  initialTarget,
}: {
  data: CoachAssignmentComposerData;
  initialTarget?: string;
}) {
  return (
    <>
      <PageHeader
        description="Assignez un contenu, un quiz ou les deux à un coaché ou une cohorte."
        title="Nouvelle assignation"
      />
      <div className="p-4 sm:p-6">
        <AssignmentComposerForm data={data} initialTarget={initialTarget} />
      </div>
    </>
  );
}
