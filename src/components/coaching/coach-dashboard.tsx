import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
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
import type {
  CoachDashboardAttentionItem,
  CoachDashboardData,
} from "@/services/coach-service";
import { formatDate, formatDateTime, formatPercent } from "@/utils/format";

const attentionItemIcons: Record<
  CoachDashboardAttentionItem["id"],
  typeof AlertTriangle
> = {
  correction: Clock,
  late_assignment: CheckSquare,
  message: MessageCircle,
  path_blocked: AlertTriangle,
};

const attentionItemStyles: Record<CoachDashboardAttentionItem["id"], string> = {
  correction: "border-indigo-100 bg-indigo-50/70 text-indigo-700",
  late_assignment: "border-amber-100 bg-amber-50/70 text-amber-700",
  message: "border-sky-100 bg-sky-50/70 text-sky-700",
  path_blocked: "border-rose-100 bg-rose-50/70 text-rose-700",
};

function AttentionItemCard({ item }: { item: CoachDashboardAttentionItem }) {
  const Icon = attentionItemIcons[item.id];

  return (
    <Link
      className="group grid min-h-32 gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-sky-900/[0.03] transition hover:border-sky-200 hover:shadow-md hover:shadow-sky-900/5"
      href={item.href}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${attentionItemStyles[item.id]}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {item.label}
        </div>
        <span className="rounded-full bg-slate-950 px-2.5 py-1 text-xs font-semibold text-white">
          {item.count}
        </span>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {item.description}
        </p>
      </div>
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-700">
        Traiter
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

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
            helper="Messages, corrections, retards et parcours"
            icon={AlertTriangle}
            label="À traiter"
            tone="rose"
            value={String(data.metrics.attentionCount)}
          />
          <StatCard
            helper="Questions ouvertes à corriger"
            icon={Clock}
            label="À corriger"
            tone="indigo"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
          <StatCard
            helper="Moyenne sur les quiz soumis"
            icon={Trophy}
            label="Score moyen"
            tone="emerald"
            value={formatPercent(data.metrics.averageScore)}
          />
        </section>

        <section className="rounded-xl border border-sky-100 bg-white/95 p-5 shadow-sm shadow-sky-900/5">
          <div className="flex flex-col gap-3 border-b border-sky-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">À traiter maintenant</h2>
              <p className="mt-1 text-sm text-slate-500">
                {data.metrics.unreadMessagesCount} messages non lus ·{" "}
                {data.metrics.blockedLearningPathsCount} blocages parcours ·{" "}
                {data.metrics.lateAssignmentsCount} retards
              </p>
            </div>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
              href="/coach/notifications"
            >
              Voir les notifications
            </Link>
          </div>
          {data.attentionItems.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {data.attentionItems.map((item) => (
                <AttentionItemCard item={item} key={item.id} />
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                description="Aucun message non lu, correction en attente, retard ou blocage parcours détecté."
                icon={CheckSquare}
                title="Tout est à jour"
              />
            </div>
          )}
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
