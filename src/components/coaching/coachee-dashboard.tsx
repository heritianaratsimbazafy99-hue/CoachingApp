import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  CheckSquare,
  History,
  Trophy,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { CoacheeDashboardData } from "@/services/coachee-service";
import { contentTypeLabel, formatDate, formatDateTime } from "@/utils/format";
import { cn } from "@/utils/cn";

export function CoacheeDashboard({ data }: { data: CoacheeDashboardData }) {
  return (
    <>
      <PageHeader
        description="Un espace simple pour continuer votre parcours, voir vos deadlines et échanger avec votre coach."
        title={`Bonjour ${data.firstName}`}
      />
      <div className="space-y-6 p-4 sm:p-6">
        <section className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-950/[0.04]">
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-sky-700">
                Progression globale
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950 sm:text-3xl">
                {data.nextTask
                  ? "Continuez votre parcours"
                  : "Votre parcours est à jour"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {data.nextTask
                  ? `Prochaine action : ${data.nextTask.title}`
                  : "Aucune action prioritaire pour le moment."}
              </p>
              <Link
                className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full sm:w-auto")}
                href={data.nextTask?.href ?? "/coachee/tasks"}
              >
                {data.nextTask ? data.nextTask.ctaLabel : "Voir mes tâches"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-end justify-between gap-3">
                <p className="text-sm font-semibold text-slate-500">Avancement</p>
                <p className="text-3xl font-semibold tracking-normal text-slate-950">
                  {data.metrics.progress}%
                </p>
              </div>
              <ProgressBar value={data.metrics.progress} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Tâches ouvertes"
            icon={CheckSquare}
            label="À faire"
            tone="sky"
            value={String(data.metrics.openTasksCount)}
          />
          <StatCard
            helper="Moyenne de vos quiz"
            icon={Trophy}
            label="Scores"
            tone="indigo"
            value={`${data.metrics.averageScore}%`}
          />
          <StatCard
            helper="Événements à venir"
            icon={CalendarDays}
            label="Agenda"
            tone="emerald"
            value={String(data.metrics.nextEventsCount)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader className="flex items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle>À faire</CardTitle>
                <CardDescription>
                  Actions ouvertes et priorités de votre parcours.
                </CardDescription>
              </div>
              <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                {data.tasks.length} tâche(s)
              </span>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {data.tasks.length ? (
                data.tasks.map((task) => (
                  <article
                    className="grid gap-4 p-5 transition hover:bg-slate-50/70 md:grid-cols-[minmax(0,1fr)_140px_150px] md:items-center [contain-intrinsic-size:120px] [content-visibility:auto]"
                    key={task.id}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Deadline {formatDate(task.deadline)}
                      </p>
                    </div>
                    <div>
                      <StatusBadge status={task.progressStatus} />
                    </div>
                    <Link
                      className={cn(
                        buttonVariants({ variant: "secondary" }),
                        "w-full md:w-auto",
                      )}
                      href={task.href}
                    >
                      {task.ctaLabel}
                    </Link>
                  </article>
                ))
              ) : (
                <div className="p-5">
                  <EmptyState
                    description="Votre coach n'a pas encore assigné de tâche."
                    icon={CheckSquare}
                    title="Aucune tâche"
                  />
                </div>
              )}
            </div>
          </Card>

          <aside className="space-y-6">
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <BookOpenCheck className="h-5 w-5 text-sky-600" />
                <h2 className="font-semibold text-slate-950">
                  Ressources importantes
                </h2>
              </div>
              <div className="mt-5 space-y-3">
                {data.resources.length ? (
                  data.resources.map((resource) => (
                    <Link
                      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50 [contain-intrinsic-size:120px] [content-visibility:auto]"
                      href={resource.href}
                      key={resource.id}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-950">
                          {resource.title}
                        </p>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                          {contentTypeLabel[resource.type]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {resource.description || "Ressource de votre parcours."}
                      </p>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    description="Les ressources assignées apparaîtront ici."
                    icon={BookOpenCheck}
                    title="Aucune ressource"
                  />
                )}
              </div>
              {data.calendarEvents[0] ? (
                <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  Prochain rendez-vous :{" "}
                  {formatDateTime(data.calendarEvents[0].startTime)}
                </div>
              ) : null}
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-600" />
                <h2 className="font-semibold text-slate-950">
                  Dernières actions
                </h2>
              </div>
              <div className="mt-5 space-y-3">
                {data.recentActivity.length ? (
                  data.recentActivity.map((activity) => (
                    <Link
                      className="block rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:bg-slate-50 [contain-intrinsic-size:96px] [content-visibility:auto]"
                      href={activity.href}
                      key={activity.id}
                    >
                      <p className="text-sm font-semibold text-slate-950">
                        {activity.action}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {activity.detail}
                      </p>
                      <p className="mt-1 text-xs font-medium text-slate-400">
                        {formatDateTime(activity.createdAt)}
                      </p>
                    </Link>
                  ))
                ) : (
                  <EmptyState
                    description="Vos prochaines actions apparaîtront ici."
                    icon={History}
                    title="Aucune activité"
                  />
                )}
              </div>
            </Card>
          </aside>
        </section>
      </div>
    </>
  );
}
