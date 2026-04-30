import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  CheckSquare,
  Clock,
  MessageCircle,
  Trophy,
  UsersRound,
} from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CoachDashboardData } from "@/services/coach-service";
import { formatDate, formatDateTime, formatPercent } from "@/utils/format";

export function CoachDashboard({ data }: { data: CoachDashboardData }) {
  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
              href="/coach/assignments/new"
            >
              Nouvelle assignation
            </Link>
            <Link
              className="rounded-lg border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-sky-900/5 transition hover:bg-sky-50 hover:text-sky-700"
              href="/coach/calendar"
            >
              Planifier
            </Link>
          </>
        }
        description="Vue centrale des retards, progressions, scores, rendez-vous et messages."
        title="Cockpit coach"
      />

      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Coachés avec une activité récente"
            icon={UsersRound}
            label="Coachés actifs"
            value={String(data.metrics.activeCoacheesCount)}
          />
          <StatCard
            helper="À traiter aujourd'hui"
            icon={AlertTriangle}
            label="Assignations en retard"
            value={String(data.metrics.lateAssignmentsCount)}
          />
          <StatCard
            helper="Questions ouvertes à corriger"
            icon={Clock}
            label="À corriger"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
          <StatCard
            helper="Moyenne sur les quiz soumis"
            icon={Trophy}
            label="Score moyen"
            value={formatPercent(data.metrics.averageScore)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-xl border border-sky-100 bg-white shadow-sm shadow-sky-900/5">
            <div className="flex items-center justify-between border-b border-sky-100 p-5">
              <div>
                <h2 className="text-lg font-semibold">Coachés à suivre</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Priorités calculées à partir des deadlines et derniers scores.
                </p>
              </div>
              <Link
                className="text-sm font-medium text-sky-700 hover:underline"
                href="/coach/coachees"
              >
                Tout voir
              </Link>
            </div>
            {data.coachees.length ? (
              <div className="divide-y divide-slate-100">
                {data.coachees.map((coachee) => (
                  <div
                    className="grid gap-4 p-5 md:grid-cols-[1fr_180px_150px]"
                    key={coachee.id}
                  >
                    <div>
                      <Link
                        className="font-semibold hover:underline"
                        href={`/coach/coachees/${coachee.id}`}
                      >
                        {coachee.fullName}
                      </Link>
                      <p className="mt-1 text-sm text-slate-500">
                        Dernière activité : {formatDateTime(coachee.lastActiveAt)}
                      </p>
                    </div>
                    <div>
                      <div className="mb-2 flex justify-between text-xs text-slate-500">
                        <span>Progression</span>
                        <span>{coachee.progress}%</span>
                      </div>
                      <ProgressBar value={coachee.progress} />
                    </div>
                    <Link
                      className="inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
                      href={`/coach/coachees/${coachee.id}`}
                    >
                      Ouvrir le suivi
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5">
                <EmptyState
                  description="Ajoutez des membres dans vos cohortes pour commencer le suivi réel."
                  icon={UsersRound}
                  title="Aucun coaché à suivre"
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold">Prochains rendez-vous</h2>
              </div>
              <div className="mt-4 space-y-3">
                {data.calendarEvents.length ? (
                  data.calendarEvents.map((event) => (
                    <div className="rounded-lg bg-sky-50/70 p-4" key={event.id}>
                      <p className="font-medium">{event.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(event.startTime)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg bg-sky-50/70 p-4 text-sm text-slate-500">
                    Aucun rendez-vous planifié.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold">Activité récente</h2>
              </div>
              <div className="mt-4 space-y-3">
                {data.activityLogs.length ? (
                  data.activityLogs.map((activity) => (
                    <div
                      className="rounded-lg border border-sky-100 p-3"
                      key={activity.id}
                    >
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-lg border border-sky-100 p-3 text-sm text-slate-500">
                    Aucune activité récente.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-sky-100 bg-white shadow-sm shadow-sky-900/5">
          <div className="flex items-center gap-2 border-b border-sky-100 p-5">
            <CheckSquare className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold">Assignations récentes</h2>
          </div>
          {data.assignments.length ? (
            <div className="divide-y divide-slate-100">
              {data.assignments.map((assignment) => (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[1fr_120px_130px_120px]"
                  key={assignment.id}
                >
                  <div>
                    <p className="font-medium">{assignment.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignment.description}
                    </p>
                  </div>
                  <StatusBadge status={assignment.status} />
                  <p className="text-sm text-slate-600">
                    Deadline {formatDate(assignment.deadline)}
                  </p>
                  <p className="text-sm text-slate-500">
                    {assignment.contentTitle}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                description="Les prochaines assignations apparaîtront ici dès leur création."
                icon={CheckSquare}
                title="Aucune assignation"
              />
            </div>
          )}
        </section>
      </div>
    </>
  );
}
