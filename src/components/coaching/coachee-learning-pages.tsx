import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Trophy,
} from "lucide-react";
import { completeContentAction } from "@/app/coachee/actions";
import { QuizRunner } from "@/components/coaching/quiz-runner";
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
      <div className="space-y-4 p-6">
        {data.tasks.length ? (
          data.tasks.map((task) => (
            <article
              className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5 md:grid-cols-[1fr_130px_110px_140px]"
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
                className="rounded-lg bg-slate-950 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                href={task.href}
              >
                {task.ctaLabel}
              </Link>
            </article>
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
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
        <article className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-950/5">
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
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
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                  href={data.content.fileUrl}
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
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
                type="submit"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marquer comme terminé
              </button>
            </form>
            {data.quizHref ? (
              <Link
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                href={data.quizHref}
              >
                Passer au quiz
              </Link>
            ) : null}
          </div>
        </article>

        <aside className="rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm shadow-emerald-950/5">
          <h2 className="font-semibold text-slate-950">Progression</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>1. Lire le contenu</p>
            <p>2. Marquer comme terminé</p>
            {data.quizTitle ? <p>3. Passer le quiz : {data.quizTitle}</p> : null}
            <p>Dernière mise à jour : {formatDate(data.content.updatedAt)}</p>
          </div>
        </aside>
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
      <div className="space-y-6 p-6">
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
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
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
          </div>
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

export function CoacheeProfilePage() {
  return (
    <>
      <PageHeader
        description="Vos informations de compte et préférences."
        title="Mon profil"
      />
      <div className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Informations personnelles</h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Le profil réel sera branché dans le prochain passage avec édition
            sécurisée des informations personnelles.
          </p>
        </section>
      </div>
    </>
  );
}
