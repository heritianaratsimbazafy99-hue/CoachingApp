"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { SendHorizonal } from "lucide-react";
import {
  createAssignmentAction,
  initialCreateAssignmentState,
} from "@/app/coach/assignments/actions";
import type { CoachAssignmentComposerData } from "@/services/coach-service";
import { cn } from "@/utils/cn";
import { contentTypeLabel } from "@/utils/format";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-emerald-700 bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-900/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <SendHorizonal className="h-4 w-4" />
      {pending ? "Création..." : "Créer l'assignation"}
    </button>
  );
}

export function AssignmentComposerForm({
  data,
}: {
  data: CoachAssignmentComposerData;
}) {
  const [state, formAction] = useActionState(
    createAssignmentAction,
    initialCreateAssignmentState,
  );
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 10);

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-sm shadow-emerald-950/5 lg:grid-cols-[1fr_340px]"
    >
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Titre</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            name="title"
            placeholder="Ex : Module posture + quiz"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            Description courte
          </span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            name="description"
            placeholder="Objectif de l'assignation"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            Instructions
          </span>
          <textarea
            className="mt-2 min-h-36 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            name="instructions"
            placeholder="Message visible côté coaché"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Contenu</span>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              name="contentId"
            >
              <option value="">Aucun contenu</option>
              {data.contents.map((content) => (
                <option key={content.id} value={content.id}>
                  {content.title} · {contentTypeLabel[content.type]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-800">Quiz</span>
            <select
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              name="quizId"
            >
              <option value="">Aucun quiz</option>
              {data.quizzes.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <aside className="space-y-5 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-5">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Cible</span>
          <select
            className="mt-2 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            name="target"
            required
          >
            <option value="">Choisir une cible</option>
            {data.coachees.map((coachee) => (
              <option key={coachee.id} value={`coachee:${coachee.id}`}>
                Coaché : {coachee.fullName}
              </option>
            ))}
            {data.cohorts.map((cohort) => (
              <option key={cohort.id} value={`cohort:${cohort.id}`}>
                Cohorte : {cohort.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Deadline</span>
          <input
            className="mt-2 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            min={minDate}
            name="deadline"
            type="date"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Priorité</span>
          <select
            className="mt-2 w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
            defaultValue="normal"
            name="priority"
          >
            <option value="normal">Normale</option>
            <option value="high">Importante</option>
          </select>
        </label>

        {state.message ? (
          <p
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-medium",
              state.status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-600",
            )}
          >
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </aside>
    </form>
  );
}
