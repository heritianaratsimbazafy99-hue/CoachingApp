import Link from "next/link";
import { CalendarDays, CheckSquare, MessageCircle, Trophy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CoacheeDashboardData } from "@/services/coachee-service";
import { contentTypeLabel, formatDate, formatDateTime } from "@/utils/format";

export function CoacheeDashboard({ data }: { data: CoacheeDashboardData }) {
  return (
    <>
      <PageHeader
        description="Un espace simple pour continuer votre parcours, voir vos deadlines et échanger avec votre coach."
        title={`Bonjour ${data.firstName}`}
      />
      <div className="space-y-6 p-6">
        <section className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm shadow-emerald-950/5">
          <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-center">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Progression globale
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-[#10231f]">
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
                className="mt-5 inline-flex rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                href={data.nextTask?.href ?? "/coachee/tasks"}
              >
                {data.nextTask ? data.nextTask.ctaLabel : "Voir mes tâches"}
              </Link>
            </div>
            <div>
              <p className="mb-2 text-right text-sm font-semibold">
                {data.metrics.progress}%
              </p>
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold text-slate-950">À faire</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {data.tasks.length ? (
                data.tasks.map((task) => (
                  <div
                    className="grid gap-3 p-5 md:grid-cols-[1fr_120px_130px]"
                    key={task.id}
                  >
                    <div>
                      <p className="font-semibold text-slate-950">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Deadline {formatDate(task.deadline)}
                      </p>
                    </div>
                    <StatusBadge status={task.progressStatus} />
                    <Link
                      className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      href={task.href}
                    >
                      {task.ctaLabel}
                    </Link>
                  </div>
                ))
              ) : (
                <p className="p-5 text-sm text-slate-500">
                  Votre coach n&apos;a pas encore assigné de tâche.
                </p>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm shadow-sky-950/5">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-sky-600" />
              <h2 className="font-semibold text-slate-950">
                Ressources importantes
              </h2>
            </div>
            <div className="mt-5 space-y-3">
              {data.resources.length ? (
                data.resources.map((resource) => (
                  <Link
                    className="block rounded-xl border border-slate-200 p-4 transition hover:bg-sky-50"
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
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Les ressources assignées apparaîtront ici.
                </p>
              )}
            </div>
            {data.calendarEvents[0] ? (
              <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                Prochain rendez-vous :{" "}
                {formatDateTime(data.calendarEvents[0].startTime)}
              </div>
            ) : null}
          </aside>
        </section>
      </div>
    </>
  );
}
