import Link from "next/link";
import {
  Award,
  BarChart3,
  BookCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
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
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

function percentWidth(value: number) {
  return `${Math.min(100, Math.max(0, Math.round(value)))}%`;
}

function ScoreMeter({ value }: { value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-2xl font-semibold tracking-normal text-indigo-700">
          {formatPercent(value)}
        </p>
        <p className="text-xs font-semibold uppercase text-slate-400">
          score
        </p>
      </div>
      <div className="mt-3 h-2 rounded-full bg-white ring-1 ring-indigo-100">
        <div
          className="h-full rounded-full bg-indigo-500"
          style={{ width: percentWidth(value) }}
        />
      </div>
    </div>
  );
}

function QuizMetaTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200/70 bg-slate-50/80 px-3 py-2">
      <dt className="text-xs font-semibold text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

export function QuizzesPage({ data }: { data: CoachQuizzesData }) {
  return (
    <>
      <PageHeader
        actions={
          <Link
            className={buttonVariants()}
            href="/coach/quizzes/new"
          >
            <Plus className="h-4 w-4" />
            Nouveau quiz
          </Link>
        }
        description="Créez vos quiz, suivez leur usage et repérez les corrections à faire."
        title="Quiz"
      />

      <div className="space-y-6 p-4 sm:p-6">
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
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.06]"
                key={quiz.id}
              >
                <div className="grid gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_170px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                        {quiz.questionCount} questions
                      </span>
                      <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        {quiz.passingScore}% requis
                      </span>
                    </div>
                    <h2 className="mt-4 text-lg font-semibold text-slate-950 transition group-hover:text-sky-700">
                      {quiz.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {quiz.description || "Aucune description renseignée."}
                    </p>
                  </div>
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
                    <ScoreMeter value={quiz.averageScore} />
                  </div>
                </div>

                <dl className="grid gap-3 border-y border-slate-100 bg-slate-50/40 p-4 text-sm sm:grid-cols-3">
                  <QuizMetaTile label="Assigné" value={quiz.assignmentCount} />
                  <QuizMetaTile
                    label="À corriger"
                    value={quiz.pendingCorrectionsCount}
                  />
                  <QuizMetaTile
                    label="Mis à jour"
                    value={formatDate(quiz.updatedAt)}
                  />
                </dl>

                <div className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600">
                    {quiz.contentTitle}
                  </p>
                  {quiz.isOwner ? (
                    <Link
                      className={buttonVariants({ variant: "secondary" })}
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
                className={buttonVariants()}
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
      <div className="space-y-6 p-4 sm:p-6">
        <QuizEditorForm data={data} />

        {data.quiz ? (
          <section className="space-y-4">
            {data.quiz.questions.length ? (
              data.quiz.questions.map((question) => (
                <Card className="p-5" key={question.id}>
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
                </Card>
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
        description="Scores, statuts, corrections et feedbacks par coaché."
        title="Résultats quiz"
      />
      <div className="space-y-6 p-4 sm:p-6">
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
          <Card className="overflow-hidden">
            <div className="divide-y divide-slate-100">
              {data.results.map((attempt) => (
                <div
                  className="grid gap-4 p-5 transition hover:bg-slate-50 lg:grid-cols-[minmax(0,1fr)_220px_170px]"
                  key={attempt.id}
                >
                  <div className="min-w-0">
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
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-3">
                    <ScoreMeter value={attempt.percentage} />
                    <p className="mt-2 text-xs font-medium text-slate-500">
                      {attempt.scoreObtained}/{attempt.scoreMax} points
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-start lg:justify-center">
                    <StatusBadge status={attempt.status} />
                    <p className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDateTime(attempt.submittedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
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
      <div className="space-y-6 p-4 sm:p-6">
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
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04]"
                key={item.answerId}
              >
                <div className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50/40 p-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
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
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                    <Award className="h-3.5 w-3.5" />
                    Max {item.pointsMax} pts
                  </span>
                </div>

                <div className="p-5">
                  <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      {item.questionText}
                    </p>
                    <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-6 text-slate-600 ring-1 ring-slate-200/80">
                      {item.answerText}
                    </p>
                  </div>

                  <CorrectionForm item={item} />
                </div>
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
