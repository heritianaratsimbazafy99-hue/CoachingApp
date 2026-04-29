"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeft, ArrowRight, SendHorizonal } from "lucide-react";
import { submitQuizAction, type CoacheeActionState } from "@/app/coachee/actions";
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
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="p-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            Demandez à votre coach de compléter ce quiz avant de le passer.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader description={data.quiz.description} title={data.quiz.title} />
      <div className="grid gap-6 p-6 xl:grid-cols-[1fr_320px]">
        <form
          action={formAction}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-950/5"
        >
          <input
            name="assignmentId"
            type="hidden"
            value={data.assignment?.id ?? ""}
          />
          <input name="quizId" type="hidden" value={data.quiz.id} />

          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>
                Question {step + 1}/{questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          {questions.map((item) => (
            <section
              className={cn(item.id === question.id ? "block" : "hidden")}
              key={item.id}
            >
              <p className="text-sm font-semibold text-sky-700">
                {item.points} points
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {item.questionText}
              </h2>

              <div className="mt-6 space-y-3">
                {item.questionType === "open" ? (
                  <textarea
                    className="min-h-40 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
                          "block cursor-pointer rounded-xl border px-4 py-3 text-sm transition",
                          isSelected
                            ? "border-sky-600 bg-sky-600 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        key={option.id}
                      >
                        <input
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
                        {option.optionText}
                      </label>
                    );
                  })
                )}
              </div>
            </section>
          ))}

          {state.message ? (
            <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {state.message}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row">
            <button
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
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
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                onClick={() => setStep((current) => current + 1)}
                type="button"
              >
                Suivant
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm shadow-sky-900/5">
            <h2 className="font-semibold text-slate-950">Objectif</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Score minimum : {formatPercent(data.quiz.passingScore)}. Les
              questions ouvertes seront envoyées à votre coach pour correction.
            </p>
            <div className="mt-4 rounded-xl bg-sky-50 p-4 text-sm text-sky-800">
              Barème total : {selectedScore.max} points
            </div>
          </section>

          {data.latestAttempt ? (
            <section className="rounded-2xl border border-indigo-900/10 bg-white p-5 shadow-sm shadow-indigo-950/5">
              <h2 className="font-semibold text-slate-950">
                Dernière tentative
              </h2>
              <p className="mt-3 text-4xl font-semibold text-indigo-700">
                {formatPercent(data.latestAttempt.percentage)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {data.latestAttempt.scoreObtained}/{data.latestAttempt.scoreMax}{" "}
                points · {formatDateTime(data.latestAttempt.submittedAt)}
              </p>
              <div className="mt-4">
                <StatusBadge status={data.latestAttempt.status} />
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
