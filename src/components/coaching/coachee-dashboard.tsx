import Link from "next/link";
import { CalendarDays, CheckSquare, MessageCircle, Trophy } from "lucide-react";
import {
  calendarEvents,
  getCoacheeAssignments,
  getContent,
  quizAttempts,
} from "@/lib/demo-data";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime } from "@/utils/format";

const demoUserId = "coachee-1";

export function CoacheeDashboard() {
  const tasks = getCoacheeAssignments(demoUserId);
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return (
    <>
      <PageHeader
        description="Un espace simple pour continuer votre parcours, voir vos deadlines et échanger avec votre coach."
        title="Bonjour Aina"
      />
      <div className="space-y-6 p-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-6 md:grid-cols-[1fr_260px] md:items-center">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Progression globale
              </p>
              <h2 className="mt-2 text-3xl font-semibold">
                Continuez votre parcours
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Votre prochaine action recommandée est le module “Posture de
                progression”.
              </p>
              <Link
                className="mt-5 inline-flex rounded-lg bg-slate-950 px-5 py-3 text-sm font-medium text-white"
                href="/coachee/tasks"
              >
                Continuer mon parcours
              </Link>
            </div>
            <div>
              <p className="mb-2 text-right text-sm font-semibold">{progress}%</p>
              <ProgressBar value={progress} />
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="À faire cette semaine"
            icon={CheckSquare}
            label="Tâches"
            value={String(tasks.length)}
          />
          <StatCard
            helper="Quiz soumis"
            icon={Trophy}
            label="Scores"
            value={`${quizAttempts[0]?.percentage ?? 0}%`}
          />
          <StatCard
            helper="Événements à venir"
            icon={CalendarDays}
            label="Agenda"
            value={String(calendarEvents.length)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="font-semibold">À faire cette semaine</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <div className="grid gap-3 p-5 md:grid-cols-[1fr_120px_120px]" key={task.id}>
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Deadline {formatDate(task.deadline)}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                  <Link
                    className="rounded-lg border border-slate-200 px-4 py-2 text-center text-sm font-medium text-slate-700"
                    href={
                      task.contentId
                        ? `/coachee/contents/${task.contentId}`
                        : `/coachee/quiz/${task.quizId}`
                    }
                  >
                    Commencer
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold">Ressources importantes</h2>
            </div>
            <div className="mt-5 space-y-3">
              {tasks
                .filter((task) => task.contentId)
                .map((task) => {
                  const content = getContent(task.contentId ?? "");
                  return (
                    <Link
                      className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
                      href={`/coachee/contents/${content?.id}`}
                      key={task.id}
                    >
                      <p className="font-medium">{content?.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {content?.description}
                      </p>
                    </Link>
                  );
                })}
            </div>
            <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              Prochain rendez-vous : {formatDateTime(calendarEvents[0].startTime)}
            </div>
          </aside>
        </section>
      </div>
    </>
  );
}
