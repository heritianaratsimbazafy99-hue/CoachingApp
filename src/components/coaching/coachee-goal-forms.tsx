"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { NotebookPen, Target } from "lucide-react";
import {
  createCoacheeGoalAction,
  createCoachNoteAction,
  type CoachGoalActionState,
  type CoachNoteActionState,
} from "@/app/coach/coachees/actions";
import { cn } from "@/utils/cn";

const initialGoalState: CoachGoalActionState = {
  message: "",
  status: "idle",
};

const initialNoteState: CoachNoteActionState = {
  message: "",
  status: "idle",
};

function StateMessage({
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

function GoalSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Target className="h-4 w-4" />
      {pending ? "Création..." : "Ajouter l'objectif"}
    </button>
  );
}

function NoteSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 text-sm font-semibold text-white transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <NotebookPen className="h-4 w-4" />
      {pending ? "Enregistrement..." : "Enregistrer la note"}
    </button>
  );
}

export function CoacheeGoalForm({ coacheeId }: { coacheeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createCoacheeGoalAction,
    initialGoalState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <input name="coacheeId" type="hidden" value={coacheeId} />
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Objectif</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="title"
          placeholder="Ex : Finaliser le module posture"
          required
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">
          Échéance optionnelle
        </span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="dueDate"
          type="date"
        />
      </label>
      <StateMessage message={state.message} status={state.status} />
      <GoalSubmitButton />
    </form>
  );
}

export function CoachNoteForm({ coacheeId }: { coacheeId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createCoachNoteAction,
    initialNoteState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-3" ref={formRef}>
      <input name="coacheeId" type="hidden" value={coacheeId} />
      <textarea
        className="min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
        name="note"
        placeholder="Ajouter une note privée..."
        required
      />
      <StateMessage message={state.message} status={state.status} />
      <NoteSubmitButton />
    </form>
  );
}
