"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ListChecks,
  SendHorizonal,
} from "lucide-react";
import { submitQuizAction, type CoacheeActionState } from "@/app/coachee/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CoacheeQuizData } from "@/services/coachee-service";
import { cn } from "@/utils/cn";
import { formatDateTime, formatPercent } from "@/utils/format";

const initialCoacheeActionState: CoacheeActionState = {
  message: "",
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
      disabled={pending}
      type="submit"
    >
      <SendHorizonal className="h-4 w-4" />
      {pending ? "Soumission..." : "Soumettre"}
    </button>
  );
}

export function QuizRunner({ data }: { data: CoacheeQuizData }) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [state, formAction] = useActionState(
    submitQuizAction,
    initialCoacheeActionState,
  );
  const questions = data.quiz.questions;
  const question = questions[step];
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0;
  const answeredCount = questions.filter((item) => {
    if (item.questionType === "open") {
      return false;
    }

    return Boolean(selected[item.id]?.length);
  }).length;
  const selectedScore = useMemo(() => {
    return questions.reduce(
      (sum, current) => {
        if (current.questionType === "open") {
          return {
            max: sum.max + current.points,
            obtained: sum.obtained,
            pending: true,
          };
        }

        return {
          max: sum.max + current.points,
          obtained: sum.obtained,
          pending: sum.pending,
        };
      },
      { max: 0, obtained: 0, pending: false },
    );
  }, [questions]);

  function toggleOption(questionId: string, optionId: string) {
    const targetQuestion = questions.find((item) => item.id === questionId);

    setSelected((current) => {
      if (targetQuestion?.questionType === "single_choice") {
        return { ...current, [questionId]: [optionId] };
      }

      const existing = current[questionId] ?? [];

      return {
        ...current,
        [questionId]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId],
      };
    });
  }

  if (!questions.length) {
    return (
      <>
        <PageHeader
          description="Ce quiz ne contient pas encore de question."
          title={data.quiz.title}
        />
        <div className="p-4 sm:p-6">
          <EmptyState
            description="Demandez à votre coach de compléter ce quiz avant de le passer."
            icon={ListChecks}
            title="Quiz indisponible"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader description={data.quiz.description} title={data.quiz.title} />
      <div className="grid gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form
          action={formAction}
          className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm shadow-slate-950/[0.04]"
        >
          <input
            name="assignmentId"
            type="hidden"
            value={data.assignment?.id ?? ""}
          />
          <input name="quizId" type="hidden" value={data.quiz.id} />

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-slate-500">
              <span className="truncate">
                Question {step + 1} sur {questions.length}
              </span>
              <span className="shrink-0">{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <div className="p-5 sm:p-6">
            {questions.map((item) => (
              <section
                className={cn(item.id === question.id ? "block" : "hidden")}
                key={item.id}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                    {item.points} points
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {item.questionType === "open"
                      ? "Réponse ouverte"
                      : item.questionType === "single_choice"
                        ? "Choix unique"
                        : "Choix multiple"}
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-normal text-slate-950 sm:text-2xl">
                  {item.questionText}
                </h2>

                <div className="mt-6 space-y-3">
                  {item.questionType === "open" ? (
                    <textarea
                      className="min-h-44 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                      name={`open:${item.id}`}
                      placeholder="Votre réponse..."
                      required
                    />
                  ) : (
                    item.options.map((option) => {
                      const isSelected = selected[item.id]?.includes(option.id);

                      return (
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-6 transition",
                            isSelected
                              ? "border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-950/15"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                          )}
                          key={option.id}
                        >
                          <input
                            checked={Boolean(isSelected)}
                            className="sr-only"
                            name={`selected:${item.id}`}
                            onChange={() => toggleOption(item.id, option.id)}
                            type={
                              item.questionType === "single_choice"
                                ? "radio"
                                : "checkbox"
                            }
                            value={option.id}
                          />
                          <span
                            className={cn(
                              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                              isSelected
                                ? "border-white/80 bg-white text-sky-700"
                                : "border-slate-300 bg-white text-transparent",
                            )}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 break-words">
                            {option.optionText}
                          </span>
                        </label>
                      );
                    })
                  )}
                </div>
              </section>
            ))}

            <FormStatusMessage
              className="mt-6"
              message={state.message}
              status={state.status}
            />

            <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
              <button
                className={cn(
                  buttonVariants({ size: "lg", variant: "secondary" }),
                  "w-full sm:w-auto",
                )}
                disabled={step === 0}
                onClick={() => setStep((current) => current - 1)}
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </button>
              {step === questions.length - 1 ? (
                <SubmitButton />
              ) : (
                <button
                  className={cn(buttonVariants({ size: "lg" }), "w-full sm:w-auto")}
                  onClick={() => setStep((current) => current + 1)}
                  type="button"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </form>

        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Objectif</CardTitle>
              <CardDescription>
                Score minimum : {formatPercent(data.quiz.passingScore)}.
              </CardDescription>
            </CardHeader>
            <div className="grid gap-3 p-5 text-sm">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-sky-800">
                Barème total : {selectedScore.max} points
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-slate-600">
                Choix cochés : {answeredCount} question(s). Les réponses
                ouvertes partent en correction coach.
              </div>
            </div>
          </Card>

          {data.latestAttempt ? (
            <Card>
              <CardHeader>
                <CardTitle>Dernière tentative</CardTitle>
                <CardDescription>
                  {formatDateTime(data.latestAttempt.submittedAt)}
                </CardDescription>
              </CardHeader>
              <div className="p-5">
                <p className="text-4xl font-semibold tracking-normal text-indigo-700">
                  {formatPercent(data.latestAttempt.percentage)}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {data.latestAttempt.scoreObtained}/
                  {data.latestAttempt.scoreMax} points
                </p>
                <div className="mt-4">
                  <ProgressBar value={data.latestAttempt.percentage} />
                </div>
                <div className="mt-4">
                  <StatusBadge status={data.latestAttempt.status} />
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-2 text-indigo-700">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-950">
                    Première tentative
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Avancez question par question, puis soumettez le quiz à la
                    fin.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
