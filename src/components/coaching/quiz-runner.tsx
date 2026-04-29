"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Quiz } from "@/types/coaching";
import { PageHeader } from "@/components/ui/page-header";
import { ProgressBar } from "@/components/ui/progress-bar";

type QuizRunnerProps = {
  quiz: Quiz;
};

export function QuizRunner({ quiz }: QuizRunnerProps) {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [openAnswer, setOpenAnswer] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const question = quiz.questions[step];
  const progress = ((step + 1) / quiz.questions.length) * 100;

  const score = useMemo(() => {
    return quiz.questions.reduce(
      (sum, current) => {
        if (current.questionType === "open") {
          return {
            max: sum.max + current.points,
            obtained: sum.obtained,
            pending: true,
          };
        }

        const correctIds = current.options
          .filter((option) => option.isCorrect)
          .map((option) => option.id)
          .sort();
        const selectedIds = (selected[current.id] ?? []).toSorted();
        const isCorrect =
          correctIds.length === selectedIds.length &&
          correctIds.every((id, index) => id === selectedIds[index]);

        return {
          max: sum.max + current.points,
          obtained: sum.obtained + (isCorrect ? current.points : 0),
          pending: sum.pending,
        };
      },
      { max: 0, obtained: 0, pending: false },
    );
  }, [quiz.questions, selected]);

  function toggleOption(optionId: string) {
    setSelected((current) => {
      if (question.questionType === "single_choice") {
        return { ...current, [question.id]: [optionId] };
      }

      const existing = current[question.id] ?? [];
      return {
        ...current,
        [question.id]: existing.includes(optionId)
          ? existing.filter((id) => id !== optionId)
          : [...existing, optionId],
      };
    });
  }

  function submitQuiz() {
    setIsSubmitted(true);
    toast.success("Quiz soumis");
  }

  if (isSubmitted) {
    const percentage = score.max ? Math.round((score.obtained / score.max) * 100) : 0;

    return (
      <>
        <PageHeader
          description="Votre résultat est enregistré. Les questions ouvertes seront corrigées par votre coach."
          title="Résultat du quiz"
        />
        <div className="p-6">
          <section className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-500">Score obtenu</p>
            <p className="mt-3 text-6xl font-semibold tracking-tight">
              {percentage}%
            </p>
            <p className="mt-4 text-slate-600">
              {score.obtained}/{score.max} points
            </p>
            <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {score.pending
                ? "Une question ouverte est en attente de correction."
                : percentage >= quiz.passingScore
                  ? "Bravo, le quiz est réussi."
                  : "Continuez, vous pouvez demander un feedback au coach."}
            </p>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader description={quiz.description} title={quiz.title} />
      <div className="p-6">
        <section className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>
                Question {step + 1}/{quiz.questions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>

          <p className="text-sm font-medium text-slate-500">
            {question.points} points
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {question.questionText}
          </h2>

          <div className="mt-6 space-y-3">
            {question.questionType === "open" ? (
              <textarea
                className="min-h-40 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm"
                onChange={(event) => setOpenAnswer(event.target.value)}
                placeholder="Votre réponse..."
                value={openAnswer}
              />
            ) : (
              question.options.map((option) => (
                <button
                  className={`block w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                    selected[question.id]?.includes(option.id)
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  key={option.id}
                  onClick={() => toggleOption(option.id)}
                  type="button"
                >
                  {option.optionText}
                </button>
              ))
            )}
          </div>

          <div className="mt-8 flex justify-between">
            <button
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              disabled={step === 0}
              onClick={() => setStep((current) => current - 1)}
              type="button"
            >
              Précédent
            </button>
            {step === quiz.questions.length - 1 ? (
              <button
                className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-medium text-white"
                onClick={submitQuiz}
                type="button"
              >
                Soumettre
              </button>
            ) : (
              <button
                className="rounded-lg bg-slate-950 px-5 py-2 text-sm font-medium text-white"
                onClick={() => setStep((current) => current + 1)}
                type="button"
              >
                Suivant
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
