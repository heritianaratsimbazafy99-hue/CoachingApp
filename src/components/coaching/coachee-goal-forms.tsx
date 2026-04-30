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
import { buttonVariants } from "@/components/ui/button";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
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
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
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
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
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
        <span className={labelClassName}>Objectif</span>
        <input
          className={inputClassName()}
          name="title"
          placeholder="Ex : Finaliser le module posture"
          required
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Échéance optionnelle</span>
        <input
          className={inputClassName()}
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
    <form action={formAction} className="space-y-4" ref={formRef}>
      <input name="coacheeId" type="hidden" value={coacheeId} />
      <label className="block">
        <span className={labelClassName}>Sujet de l&apos;entretien</span>
        <input
          className={inputClassName()}
          name="topic"
          placeholder="Ex : Entretien mensuel, blocage module 2..."
          required
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Date de l&apos;entretien</span>
        <input
          className={inputClassName()}
          name="interviewDate"
          type="date"
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Synthèse</span>
        <textarea
          className={textareaClassName("min-h-28")}
          name="note"
          placeholder="Points abordés, posture observée, décisions prises..."
          required
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Prochaines étapes</span>
        <textarea
          className={textareaClassName("min-h-20")}
          name="nextSteps"
          placeholder="Actions à suivre avant le prochain échange..."
        />
      </label>
      <StateMessage message={state.message} status={state.status} />
      <NoteSubmitButton />
    </form>
  );
}
