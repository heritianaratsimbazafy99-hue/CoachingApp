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
import {
  activityLogs,
  assignmentProgress,
  assignments,
  calendarEvents,
  contents,
  profiles,
  quizAttempts,
} from "@/lib/demo-data";
import { ActionButton } from "@/components/ui/action-button";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate, formatDateTime, formatPercent } from "@/utils/format";

export function CoachDashboard() {
  const coachees = profiles.filter((profile) => profile.role === "coachee");
  const lateAssignments = assignments.filter(
    (assignment) => assignment.status === "late",
  );
  const pendingCorrections = quizAttempts.filter(
    (attempt) => attempt.status === "pending_correction",
  );
  const averageScore =
    quizAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) /
    quizAttempts.length;

  return (
    <>
      <PageHeader
        actions={
          <>
            <Link
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href="/coach/assignments/new"
            >
              Nouvelle assignation
            </Link>
            <Link
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
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
            value={String(coachees.length)}
          />
          <StatCard
            helper="À traiter aujourd'hui"
            icon={AlertTriangle}
            label="Assignations en retard"
            value={String(lateAssignments.length)}
          />
          <StatCard
            helper="Questions ouvertes à corriger"
            icon={Clock}
            label="À corriger"
            value={String(pendingCorrections.length)}
          />
          <StatCard
            helper="Moyenne sur les quiz soumis"
            icon={Trophy}
            label="Score moyen"
            value={formatPercent(averageScore)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold">Coachés à suivre</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Priorités calculées à partir des deadlines et derniers scores.
                </p>
              </div>
              <Link
                className="text-sm font-medium text-slate-700 hover:underline"
                href="/coach/coachees"
              >
                Tout voir
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {coachees.map((coachee) => {
                const progress = assignmentProgress.filter(
                  (item) => item.userId === coachee.id,
                );
                const completed = progress.filter(
                  (item) => item.status === "completed",
                ).length;
                const percentage = progress.length
                  ? Math.round((completed / progress.length) * 100)
                  : 0;

                return (
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
                        <span>{percentage}%</span>
                      </div>
                      <ProgressBar value={percentage} />
                    </div>
                    <ActionButton message={`Relance envoyée à ${coachee.fullName}`}>
                      Relancer
                    </ActionButton>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold">Prochains rendez-vous</h2>
              </div>
              <div className="mt-4 space-y-3">
                {calendarEvents.map((event) => (
                  <div className="rounded-lg bg-slate-50 p-4" key={event.id}>
                    <p className="font-medium">{event.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(event.startTime)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-slate-500" />
                <h2 className="text-lg font-semibold">Activité récente</h2>
              </div>
              <div className="mt-4 space-y-3">
                {activityLogs.map((activity) => (
                  <div className="rounded-lg border border-slate-100 p-3" key={activity.id}>
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(activity.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 p-5">
            <CheckSquare className="h-5 w-5 text-slate-500" />
            <h2 className="text-lg font-semibold">Assignations récentes</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {assignments.map((assignment) => (
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
                  {contents.find((content) => content.id === assignment.contentId)
                    ?.title ?? "Quiz seul"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
