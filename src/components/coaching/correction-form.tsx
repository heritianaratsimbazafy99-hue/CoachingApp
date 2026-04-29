"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";
import {
  initialFormState,
  saveCorrectionAction,
} from "@/app/coach/quizzes/actions";
import type { CoachCorrectionItem } from "@/services/coach-service";
import { cn } from "@/utils/cn";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-indigo-700 bg-indigo-700 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-900/10 transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Check className="h-4 w-4" />
      {pending ? "Correction..." : "Valider"}
    </button>
  );
}

export function CorrectionForm({ item }: { item: CoachCorrectionItem }) {
  const [state, formAction] = useActionState(
    saveCorrectionAction,
    initialFormState,
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <input name="answerId" type="hidden" value={item.answerId} />
      <input name="attemptId" type="hidden" value={item.attemptId} />

      <div className="grid gap-4 md:grid-cols-[160px_1fr_auto]">
        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Points
          </span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            defaultValue={item.pointsObtained}
            max={item.pointsMax}
            min={0}
            name="pointsObtained"
            step="0.5"
            type="number"
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase text-slate-500">
            Feedback coach
          </span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            defaultValue={item.coachFeedback}
            name="coachFeedback"
            placeholder="Feedback court pour le coaché"
          />
        </label>

        <div className="flex items-end">
          <SubmitButton />
        </div>
      </div>

      {state.message ? (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-medium",
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
