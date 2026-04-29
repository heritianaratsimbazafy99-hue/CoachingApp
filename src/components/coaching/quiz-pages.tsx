import Link from "next/link";
import {
  BarChart3,
  BookCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileQuestion,
  GripVertical,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import { CorrectionForm } from "@/components/coaching/correction-form";
import { QuizEditorForm } from "@/components/coaching/quiz-editor-form";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  CoachCorrectionsData,
  CoachQuizEditorData,
  CoachQuizResultsData,
  CoachQuizzesData,
} from "@/services/coach-service";
import { formatDate, formatDateTime, formatPercent } from "@/utils/format";

const questionTypeLabel = {
  multiple_choice: "Choix multiple",
  open: "Question ouverte",
  single_choice: "Choix unique",
};

export function QuizzesPage({ data }: { data: CoachQuizzesData }) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700"
            href="/coach/quizzes/new"
          >
            <Plus className="h-4 w-4" />
            Nouveau quiz
          </Link>
        }
        description="Créez vos quiz, suivez leur usage et repérez les corrections à faire."
        title="Quiz"
      />

      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Quiz accessibles dans votre espace"
            icon={FileQuestion}
            label="Quiz"
            tone="sky"
            value={String(data.metrics.totalQuizCount)}
          />
          <StatCard
            helper="Quiz avec au moins une question"
            icon={BookCheck}
            label="Prêts"
            tone="emerald"
            value={String(data.metrics.publishedQuizCount)}
          />
          <StatCard
            helper="Moyenne des tentatives"
            icon={BarChart3}
            label="Score moyen"
            tone="indigo"
            value={formatPercent(data.metrics.averageScore)}
          />
          <StatCard
            helper="Questions ouvertes en attente"
            icon={ClipboardCheck}
            label="Corrections"
            tone="amber"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
        </section>

        {data.quizzes.length ? (
          <section className="grid gap-4 xl:grid-cols-2">
            {data.quizzes.map((quiz) => (
              <article
                className="rounded-2xl border border-sky-900/10 bg-white p-5 shadow-sm shadow-sky-950/5"
                key={quiz.id}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {quiz.questionCount} questions
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {quiz.passingScore}% requis
                      </span>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-950">
                      {quiz.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {quiz.description || "Aucune description renseignée."}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 px-4 py-3 text-center text-indigo-700">
                    <p className="text-2xl font-semibold">
                      {formatPercent(quiz.averageScore)}
                    </p>
                    <p className="text-xs font-medium">score moyen</p>
                  </div>
                </div>

                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase text-slate-400">
                      Assigné
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {quiz.assignmentCount}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase text-slate-400">
                      À corriger
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {quiz.pendingCorrectionsCount}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <dt className="text-xs font-semibold uppercase text-slate-400">
                      Mis à jour
                    </dt>
                    <dd className="mt-1 font-semibold text-slate-800">
                      {formatDate(quiz.updatedAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">{quiz.contentTitle}</p>
                  {quiz.isOwner ? (
                    <Link
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
                      href={`/coach/quizzes/${quiz.id}/edit`}
                    >
                      <Pencil className="h-4 w-4" />
                      Modifier
                    </Link>
                  ) : (
                    <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-500">
                      Assigné à vos coachés
                    </span>
                  )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <EmptyState
            action={
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white"
                href="/coach/quizzes/new"
              >
                <Plus className="h-4 w-4" />
                Créer un quiz
              </Link>
            }
            description="Ajoutez un premier quiz pour l'assigner ensuite à une cohorte ou à un coaché."
            icon={Sparkles}
            title="Aucun quiz"
          />
        )}
      </div>
    </>
  );
}

export function QuizBuilderPage({ data }: { data: CoachQuizEditorData }) {
  return (
    <>
      <PageHeader
        description="Paramètres, questions, points, bonnes réponses et explications."
        title={data.quiz ? `Modifier : ${data.quiz.title}` : "Créer un quiz"}
      />
      <div className="space-y-6 p-6">
        <QuizEditorForm data={data} />

        {data.quiz ? (
          <section className="space-y-4">
            {data.quiz.questions.length ? (
              data.quiz.questions.map((question) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-950/5"
                  key={question.id}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-xl bg-sky-50 p-2 text-sky-700">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                          Question {question.position}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          {question.points} pts
                        </span>
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">
                          {questionTypeLabel[question.questionType]}
                        </span>
                      </div>
                      <h2 className="mt-3 font-semibold text-slate-950">
                        {question.questionText}
                      </h2>

                      <div className="mt-4 grid gap-2">
                        {question.options.length ? (
                          question.options.map((option) => (
                            <div
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                              key={option.id}
                            >
                              <span>{option.optionText}</span>
                              {option.isCorrect ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Bonne réponse
                                </span>
                              ) : null}
                            </div>
                          ))
                        ) : (
                          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                            Correction manuelle par le coach.
                          </p>
                        )}
                      </div>

                      {question.explanation ? (
                        <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                          {question.explanation}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                description="Ajoutez au moins une question pour rendre ce quiz assignable et exploitable."
                icon={FileQuestion}
                title="Aucune question"
              />
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}

export function QuizResultsPage({ data }: { data: CoachQuizResultsData }) {
  return (
    <>
      <PageHeader
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            type="button"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        }
        description="Scores, statuts, corrections et feedbacks par coaché."
        title="Résultats quiz"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            helper="Tentatives visibles par votre rôle"
            icon={FileQuestion}
            label="Tentatives"
            tone="sky"
            value={String(data.metrics.attemptsCount)}
          />
          <StatCard
            helper="Score moyen obtenu"
            icon={BarChart3}
            label="Moyenne"
            tone="indigo"
            value={formatPercent(data.metrics.averageScore)}
          />
          <StatCard
            helper="Tentatives validées"
            icon={CheckCircle2}
            label="Réussites"
            tone="emerald"
            value={String(data.metrics.passedCount)}
          />
          <StatCard
            helper="Questions ouvertes à revoir"
            icon={ClipboardCheck}
            label="Corrections"
            tone="amber"
            value={String(data.metrics.pendingCorrectionsCount)}
          />
        </section>

        {data.results.length ? (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-950/5">
            <div className="divide-y divide-slate-100">
              {data.results.map((attempt) => (
                <div
                  className="grid gap-4 p-5 md:grid-cols-[1fr_180px_120px_150px]"
                  key={attempt.id}
                >
                  <div>
                    <p className="font-semibold text-slate-950">
                      {attempt.coacheeName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {attempt.quizTitle} · {attempt.assignmentTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {attempt.coacheeEmail}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {attempt.scoreObtained}/{attempt.scoreMax} points
                  </p>
                  <p className="text-sm font-semibold text-indigo-700">
                    {formatPercent(attempt.percentage)}
                  </p>
                  <div className="space-y-2">
                    <StatusBadge status={attempt.status} />
                    <p className="text-xs text-slate-400">
                      {formatDateTime(attempt.submittedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            description="Les résultats apparaîtront ici dès qu'un coaché soumettra un quiz."
            icon={BarChart3}
            title="Aucun résultat"
          />
        )}
      </div>
    </>
  );
}

export function CorrectionsPage({ data }: { data: CoachCorrectionsData }) {
  return (
    <>
      <PageHeader
        description="Corrigez les questions ouvertes, attribuez les points et ajoutez un feedback."
        title="Corrections ouvertes"
      />
      <div className="space-y-6 p-6">
        <section className="grid gap-4 md:grid-cols-2">
          <StatCard
            helper="Réponses ouvertes non corrigées"
            icon={ClipboardCheck}
            label="Réponses"
            tone="amber"
            value={String(data.metrics.pendingAnswersCount)}
          />
          <StatCard
            helper="Tentatives encore bloquées"
            icon={FileQuestion}
            label="Tentatives"
            tone="rose"
            value={String(data.metrics.pendingAttemptsCount)}
          />
        </section>

        {data.corrections.length ? (
          <section className="space-y-4">
            {data.corrections.map((item) => (
              <article
                className="rounded-2xl border border-indigo-900/10 bg-white p-5 shadow-sm shadow-indigo-950/5"
                key={item.answerId}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">
                      {item.coacheeName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.quizTitle} · {formatDateTime(item.submittedAt)}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {item.coacheeEmail}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    Max {item.pointsMax} pts
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">
                    {item.questionText}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.answerText}
                  </p>
                </div>

                <CorrectionForm item={item} />
              </article>
            ))}
          </section>
        ) : (
          <EmptyState
            description="Aucune réponse ouverte n'attend une correction pour le moment."
            icon={ClipboardCheck}
            title="Tout est corrigé"
          />
        )}
      </div>
    </>
  );
}
