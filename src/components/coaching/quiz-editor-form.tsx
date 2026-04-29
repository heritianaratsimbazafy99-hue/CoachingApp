"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, PlusCircle, Save } from "lucide-react";
import {
  addQuizQuestionAction,
  initialFormState,
  saveQuizAction,
} from "@/app/coach/quizzes/actions";
import type { CoachQuizEditorData } from "@/services/coach-service";
import type { QuestionType } from "@/types/coaching";
import { cn } from "@/utils/cn";
import { contentTypeLabel } from "@/utils/format";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  tone?: "emerald" | "slate";
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice: "Choix multiple",
  open: "Réponse ouverte",
  single_choice: "Choix unique",
};

function SubmitButton({
  label,
  pendingLabel,
  tone = "slate",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const Icon = tone === "emerald" ? PlusCircle : Save;

  return (
    <button
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60",
        tone === "emerald"
          ? "border-emerald-700 bg-emerald-700 text-white shadow-emerald-900/10 hover:bg-emerald-800"
          : "border-slate-950 bg-slate-950 text-white shadow-slate-900/10 hover:bg-slate-800",
      )}
      disabled={pending}
      type="submit"
    >
      <Icon className="h-4 w-4" />
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormMessage({
  message,
  status,
}: {
  message: string;
  status: "error" | "idle" | "success";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium",
        status === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {message}
    </p>
  );
}

export function QuizEditorForm({ data }: { data: CoachQuizEditorData }) {
  const [saveState, saveFormAction] = useActionState(
    saveQuizAction,
    initialFormState,
  );
  const [questionState, questionFormAction] = useActionState(
    addQuizQuestionAction,
    initialFormState,
  );
  const [questionType, setQuestionType] =
    useState<QuestionType>("single_choice");
  const isOpenQuestion = questionType === "open";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form
        action={saveFormAction}
        className="rounded-2xl border border-sky-900/10 bg-white p-6 shadow-sm shadow-sky-950/5"
      >
        <input name="quizId" type="hidden" value={data.quiz?.id ?? ""} />
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-800">Titre</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              defaultValue={data.quiz?.title}
              name="title"
              placeholder="Ex : Fondamentaux de posture"
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-800">
              Description
            </span>
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              defaultValue={data.quiz?.description}
              name="description"
              placeholder="Ce quiz valide les notions clés du module."
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Contenu lié
            </span>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              defaultValue={data.quiz?.contentId ?? ""}
              name="contentId"
            >
              <option value="">Sans contenu lié</option>
              {data.contents.map((content) => (
                <option key={content.id} value={content.id}>
                  {content.title} · {contentTypeLabel[content.type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Score minimum (%)
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
              defaultValue={data.quiz?.passingScore ?? 70}
              max={100}
              min={0}
              name="passingScore"
              type="number"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px] md:items-center">
          <FormMessage message={saveState.message} status={saveState.status} />
          <SubmitButton label="Enregistrer le quiz" pendingLabel="Enregistrement..." />
        </div>
      </form>

      {data.quiz ? (
        <form
          action={questionFormAction}
          className="space-y-4 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-5 shadow-sm shadow-emerald-950/5"
        >
          <input name="quizId" type="hidden" value={data.quiz.id} />
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="h-5 w-5" />
            <h2 className="text-sm font-semibold">Nouvelle question</h2>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Type</span>
            <select
              className="mt-2 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              name="questionType"
              onChange={(event) =>
                setQuestionType(event.target.value as QuestionType)
              }
              value={questionType}
            >
              {Object.entries(questionTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Question</span>
            <textarea
              className="mt-2 min-h-24 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              name="questionText"
              placeholder="Que doit maîtriser le coaché ?"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Points</span>
            <input
              className="mt-2 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              defaultValue={1}
              min={0}
              name="points"
              type="number"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Options</span>
            <textarea
              className="mt-2 min-h-28 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100 disabled:text-slate-400"
              disabled={isOpenQuestion}
              name="options"
              placeholder={"Option A\nOption B\nOption C"}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Bonnes réponses
            </span>
            <input
              className="mt-2 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:bg-slate-100 disabled:text-slate-400"
              disabled={isOpenQuestion}
              name="correctOptions"
              placeholder="1 ou 1,3"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">
              Explication
            </span>
            <textarea
              className="mt-2 min-h-20 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              name="explanation"
              placeholder="Feedback affichable après correction"
            />
          </label>

          <FormMessage
            message={questionState.message}
            status={questionState.status}
          />
          <SubmitButton
            label="Ajouter la question"
            pendingLabel="Ajout..."
            tone="emerald"
          />
        </form>
      ) : (
        <aside className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/80 p-5 text-sm leading-6 text-sky-800">
          Enregistre le quiz une première fois pour ajouter ses questions.
        </aside>
      )}
    </div>
  );
}
