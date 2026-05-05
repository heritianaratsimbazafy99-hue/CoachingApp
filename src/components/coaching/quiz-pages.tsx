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
import {
  ListMetaTile,
  ListPanel,
  ListPanelBody,
  ListPanelRow,
} from "@/components/ui/list-panel";
import { PageHeader } from "@/components/ui/page-header";
import { ReferencePill } from "@/components/ui/reference-pill";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
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
          className="h-full rounded-full bg-[linear-gradient(90deg,#0284c7,#6366f1)]"
          style={{ width: percentWidth(value) }}
        />
      </div>
    </div>
  );
}

export function QuizzesPage({ data }: { data: CoachQuizzesData }) {
  return (
    <>
      <PageHeader
        actions={
          <Link className={buttonVariants()} href="/coach/quizzes/new">
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
          <ListPanel
            countLabel={`${data.quizzes.length} quiz`}
            description="Vue opérationnelle pour retrouver les quiz, leur score moyen et les corrections en attente."
            icon={FileQuestion}
            title="Catalogue quiz"
          >
            <ListPanelBody>
              {data.quizzes.map((quiz) => (
                <ListPanelRow
                  className="xl:grid-cols-[minmax(0,1.2fr)_190px_minmax(210px,0.8fr)_auto] xl:items-center"
                  key={quiz.id}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                      <FileQuestion className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="break-words text-base font-semibold text-slate-950">
                        {quiz.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-slate-600">
                        {quiz.description || "Aucune description renseignée."}
                      </p>
                      <div className="mt-2">
                        <ReferencePill
                          title={quiz.contentTitle}
                          tone={quiz.contentTitle ? "slate" : "indigo"}
                        >
                          {quiz.contentTitle || "Sans contenu lié"}
                        </ReferencePill>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex w-fit max-w-[10rem] shrink-0 overflow-hidden rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold leading-none text-sky-700">
                          <span className="min-w-0 truncate">
                            {quiz.questionCount} questions
                          </span>
                        </span>
                        <span className="inline-flex w-fit max-w-[10rem] shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-semibold leading-none text-emerald-700">
                          <span className="min-w-0 truncate">
                            {quiz.passingScore}% requis
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-3 ring-1 ring-white">
                    <ScoreMeter value={quiz.averageScore} />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                    <ListMetaTile label="Assigné">
                      {quiz.assignmentCount}
                    </ListMetaTile>
                    <ListMetaTile label="À corriger">
                      {quiz.pendingCorrectionsCount}
                    </ListMetaTile>
                    <ListMetaTile label="Mis à jour">
                      {formatDate(quiz.updatedAt)}
                    </ListMetaTile>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2 xl:justify-end">
                    {quiz.isOwner ? (
                      <Link
                        className={buttonVariants({
                          size: "sm",
                          variant: "secondary",
                        })}
                        href={`/coach/quizzes/${quiz.id}/edit`}
                      >
                        <Pencil className="h-4 w-4" />
                        Modifier
                      </Link>
                    ) : (
                      <span className="inline-flex w-fit max-w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-medium text-slate-500">
                        <span className="max-w-[10rem] truncate">
                          Assigné à vos coachés
                        </span>
                      </span>
                    )}
                  </div>
                </ListPanelRow>
              ))}
            </ListPanelBody>
          </ListPanel>
        ) : (
          <EmptyState
            action={
              <Link className={buttonVariants()} href="/coach/quizzes/new">
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
          <ListPanel
            countLabel={`${data.quiz.questions.length} question(s)`}
            description="Ordre, points, type de correction et bonnes réponses visibles au même endroit."
            icon={FileQuestion}
            title="Questions du quiz"
          >
            {data.quiz.questions.length ? (
              <ListPanelBody>
                {data.quiz.questions.map((question) => (
                  <ListPanelRow
                    className="lg:grid-cols-[44px_minmax(0,1fr)] lg:items-start"
                    key={question.id}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-100 bg-sky-50 text-sky-700 ring-1 ring-white">
                      <GripVertical className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                        <span className="inline-flex w-fit max-w-[10rem] shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">
                          <span className="min-w-0 truncate">
                            Question {question.position}
                          </span>
                        </span>
                        <span className="inline-flex w-fit max-w-[10rem] shrink-0 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          <span className="min-w-0 truncate">
                            {question.points} pts
                          </span>
                        </span>
                        <span className="inline-flex w-fit max-w-[12rem] shrink-0 overflow-hidden rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-indigo-700">
                          <span className="min-w-0 truncate">
                            {questionTypeLabel[question.questionType]}
                          </span>
                        </span>
                      </div>
                      <h2 className="mt-3 break-words font-semibold text-slate-950">
                        {question.questionText}
                      </h2>

                      <div className="mt-4 grid gap-2">
                        {question.options.length ? (
                          question.options.map((option) => (
                            <div
                              className="flex min-w-0 items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                              key={option.id}
                            >
                              <span className="min-w-0 break-words leading-6">
                                {option.optionText}
                              </span>
                              {option.isCorrect ? (
                                <span className="inline-flex w-fit max-w-[12rem] shrink-0 items-center gap-1 overflow-hidden rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span className="min-w-0 truncate">
                                    Bonne réponse
                                  </span>
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
                  </ListPanelRow>
                ))}
              </ListPanelBody>
            ) : (
              <div className="p-6">
                <EmptyState
                  description="Ajoutez au moins une question pour rendre ce quiz assignable et exploitable."
                  icon={FileQuestion}
                  title="Aucune question"
                />
              </div>
            )}
          </ListPanel>
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
          <ListPanel
            countLabel={`${data.results.length} tentative(s)`}
            description="Lecture rapide des scores, statuts et dates de soumission."
            icon={BarChart3}
            title="Tentatives récentes"
          >
            <ListPanelBody>
              {data.results.map((attempt) => (
                <ListPanelRow
                  className="xl:grid-cols-[minmax(0,1fr)_220px_170px]"
                  key={attempt.id}
                >
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-slate-950">
                      {attempt.coacheeName}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-500">
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
                  <div className="flex min-w-0 flex-wrap items-center gap-3 xl:flex-col xl:items-start xl:justify-center">
                    <StatusBadge status={attempt.status} />
                    <p className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDateTime(attempt.submittedAt)}
                    </p>
                  </div>
                </ListPanelRow>
              ))}
            </ListPanelBody>
          </ListPanel>
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
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-950/[0.04] transition hover:border-slate-300 hover:shadow-md hover:shadow-slate-950/[0.06]"
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
