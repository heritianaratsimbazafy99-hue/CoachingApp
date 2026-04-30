import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { completeContentAction } from "@/app/coachee/actions";
import {
  NotificationPreferenceForm,
  ProfileForm,
} from "@/components/coaching/profile-settings-forms";
import { QuizRunner } from "@/components/coaching/quiz-runner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/ui/status-badge";
import type {
  CoacheeContentDetail,
  CoacheeQuizData,
  CoacheeResultsData,
  CoacheeTasksData,
} from "@/services/coachee-service";
import type { CoacheeProfileData } from "@/services/profile-service";
import { contentFileDownloadHref } from "@/utils/content-file-storage";
import {
  contentTypeLabel,
  formatDate,
  formatDateTime,
  formatPercent,
} from "@/utils/format";

export function CoacheeTasksPage({ data }: { data: CoacheeTasksData }) {
  return (
    <>
      <PageHeader
        description="Vos contenus, quiz, deadlines et retards au même endroit."
        title="Mes tâches"
      />
      <div className="space-y-4 p-4 sm:p-6">
        {data.tasks.length ? (
          data.tasks.map((task) => (
            <Card
              className="grid gap-4 p-5 md:grid-cols-[1fr_130px_110px_140px]"
              key={task.id}
            >
              <div>
                <div className="flex flex-wrap gap-2">
                  <PriorityBadge priority={task.priority} />
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {task.assignmentType === "content_quiz"
                      ? "Contenu + quiz"
                      : task.quizId
                        ? "Quiz"
                        : "Contenu"}
                  </span>
                </div>
                <p className="mt-3 font-semibold text-slate-950">{task.title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {task.instructions || task.description || "Consigne à suivre."}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Deadline {formatDate(task.deadline)}
                </p>
              </div>
              <StatusBadge status={task.progressStatus} />
              <p className="text-sm font-semibold text-slate-700">
                {task.quizTitle || task.contentTitle || "Parcours"}
              </p>
              <Link
                className={buttonVariants()}
                href={task.href}
              >
                {task.ctaLabel}
              </Link>
            </Card>
          ))
        ) : (
          <EmptyState
            description="Votre coach n'a pas encore assigné de contenu ou quiz."
            icon={BookOpen}
            title="Aucune tâche"
          />
        )}
      </div>
    </>
  );
}

export function ContentReaderPage({ data }: { data: CoacheeContentDetail }) {
  return (
    <>
      <PageHeader description={data.content.description} title={data.content.title} />
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[1fr_320px]">
        <Card className="p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
              {contentTypeLabel[data.content.type]}
            </span>
            {data.progressStatus ? <StatusBadge status={data.progressStatus} /> : null}
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg leading-8 text-slate-700">
              {data.content.body || data.content.description}
            </p>
          </div>

          {data.content.videoUrl || data.content.externalUrl || data.content.fileUrl ? (
            <div className="mt-8 grid gap-3">
              {data.content.videoUrl ? (
                <a
                  className={buttonVariants({ variant: "secondary" })}
                  href={data.content.videoUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir la vidéo
                </a>
              ) : null}
              {data.content.externalUrl ? (
                <a
                  className={buttonVariants({ variant: "secondary" })}
                  href={data.content.externalUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4" />
                  Ouvrir la ressource
                </a>
              ) : null}
              {data.content.fileUrl ? (
                <a
                  className={buttonVariants({ variant: "secondary" })}
                  href={contentFileDownloadHref(data.content.id)}
                  rel="noreferrer"
                  target="_blank"
                >
                  <FileText className="h-4 w-4" />
                  Ouvrir le document
                </a>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <form action={completeContentAction}>
              <input name="contentId" type="hidden" value={data.content.id} />
              <input
                name="assignmentId"
                type="hidden"
                value={data.assignment?.id ?? ""}
              />
              <button
                className={buttonVariants()}
                type="submit"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marquer comme terminé
              </button>
            </form>
            {!data.assignment ? (
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href="/coachee/paths"
              >
                Retour aux parcours
              </Link>
            ) : null}
            {data.quizHref ? (
              <Link
                className={buttonVariants({ variant: "secondary" })}
                href={data.quizHref}
              >
                Passer au quiz
              </Link>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Progression</CardTitle>
          </CardHeader>
          <div className="space-y-3 p-5 text-sm text-slate-600">
            <p>1. Lire le contenu</p>
            <p>2. Marquer comme terminé</p>
            {data.quizTitle ? <p>3. Passer le quiz : {data.quizTitle}</p> : null}
            {!data.assignment ? (
              <p>Retour automatique vers vos parcours après validation.</p>
            ) : null}
            <p>Dernière mise à jour : {formatDate(data.content.updatedAt)}</p>
          </div>
        </Card>
      </div>
    </>
  );
}

export function QuizPage({ data }: { data: CoacheeQuizData }) {
  return <QuizRunner data={data} />;
}

export function CoacheeResultsPage({ data }: { data: CoacheeResultsData }) {
  return (
    <>
      <PageHeader
        description="Vos scores, pourcentages, statuts et feedbacks coach."
        title="Mes scores"
      />
      <div className="space-y-6 p-4 sm:p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Quiz soumis"
            icon={Trophy}
            label="Tentatives"
            tone="sky"
            value={String(data.metrics.attemptsCount)}
          />
          <StatCard
            helper="Score moyen"
            icon={CheckCircle2}
            label="Moyenne"
            tone="indigo"
            value={formatPercent(data.metrics.averageScore)}
          />
          <StatCard
            helper="Quiz validés"
            icon={Trophy}
            label="Réussites"
            tone="emerald"
            value={String(data.metrics.passedCount)}
          />
          <StatCard
            helper="Questions ouvertes"
            icon={Clock}
            label="En correction"
            tone="amber"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
        </section>

        {data.results.length ? (
          <Card className="overflow-hidden">
            <div className="divide-y divide-slate-100">
              {data.results.map((attempt) => (
                <div
                  className="grid gap-3 p-5 md:grid-cols-[1fr_140px_140px_150px]"
                  key={attempt.id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {attempt.quizTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {attempt.assignmentTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(attempt.submittedAt)}
                    </p>
                  </div>
                  <p className="font-semibold text-slate-700">
                    {attempt.scoreObtained}/{attempt.scoreMax} points
                  </p>
                  <p className="text-2xl font-semibold text-indigo-700">
                    {formatPercent(attempt.percentage)}
                  </p>
                  <StatusBadge status={attempt.status} />
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <EmptyState
            description="Vos scores apparaîtront dès votre premier quiz soumis."
            icon={Trophy}
            title="Aucun score"
          />
        )}
      </div>
    </>
  );
}

const goalStatusLabel: Record<string, string> = {
  active: "Actif",
  completed: "Terminé",
  paused: "En pause",
};

function GoalStatusBadge({ status }: { status: string }) {
  const isCompleted = status === "completed";

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isCompleted
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-sky-200 bg-sky-50 text-sky-700"
      }`}
    >
      {goalStatusLabel[status] ?? status}
    </span>
  );
}

export function CoacheeProfilePage({ data }: { data: CoacheeProfileData }) {
  return (
    <>
      <PageHeader
        description="Vos informations de compte, avatar et objectifs suivis par votre coach."
        title="Mon profil"
      />

      <div className="space-y-6 p-4 sm:p-6">
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard
            helper="Objectifs suivis"
            icon={Target}
            label="Total"
            tone="indigo"
            value={String(data.metrics.goalsCount)}
          />
          <StatCard
            helper="À travailler"
            icon={Clock}
            label="Actifs"
            tone="sky"
            value={String(data.metrics.activeGoalsCount)}
          />
          <StatCard
            helper="Objectifs validés"
            icon={CheckCircle2}
            label="Terminés"
            tone="emerald"
            value={String(data.metrics.completedGoalsCount)}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sky-100 text-xl font-semibold text-sky-700">
                {data.profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="h-full w-full object-cover"
                    src={data.profile.avatarUrl}
                  />
                ) : (
                  data.profile.fullName.slice(0, 1)
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-700">
                  Coaché
                </p>
                <h2 className="truncate text-xl font-semibold text-slate-950">
                  {data.profile.fullName}
                </h2>
                <p className="mt-1 truncate text-sm text-slate-500">
                  {data.profile.email}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <ProfileForm profile={data.profile} />
            </div>
          </Card>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-slate-500" />
                  <CardTitle>Compte</CardTitle>
                </div>
              </CardHeader>
              <div className="space-y-3 p-5 text-sm">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-500">Email</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {data.profile.email}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-500">Profil créé le</p>
                  <p className="mt-1 font-semibold text-slate-950">
                    {formatDate(data.profile.createdAt)}
                  </p>
                </div>
              </div>
            </Card>

            <NotificationPreferenceForm
              initialEnabledCategories={
                data.profile.notificationPreferences.coachee
              }
              role="coachee"
            />
          </aside>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-emerald-600" />
              <CardTitle>Objectifs</CardTitle>
            </div>
          </CardHeader>

          {data.goals.length ? (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {data.goals.map((goal) => (
                <article
                  className="rounded-xl border border-slate-200 bg-white p-4"
                  key={goal.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-950">
                        {goal.title}
                      </h3>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <GoalStatusBadge status={goal.status} />
                        {goal.dueDate ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                            <CalendarDays className="h-3 w-3" />
                            {formatDate(goal.dueDate)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="p-5">
              <EmptyState
                description="Vos objectifs apparaîtront ici dès que votre coach les ajoutera."
                icon={Target}
                title="Aucun objectif"
              />
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
