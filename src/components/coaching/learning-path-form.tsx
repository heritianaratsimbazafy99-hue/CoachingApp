"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { BookOpenCheck, Plus } from "lucide-react";
import {
  createLearningPathAction,
  type LearningPathActionState,
} from "@/app/coach/paths/actions";
import type {
  CoachLearningPathData,
  LearningPathItemOption,
} from "@/services/learning-path-service";
import { cn } from "@/utils/cn";

const initialLearningPathActionState: LearningPathActionState = {
  message: "",
  status: "idle",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      <Plus className="h-4 w-4" />
      {pending ? "Création..." : "Créer le parcours"}
    </button>
  );
}

function ItemCheckbox({ item }: { item: LearningPathItemOption }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-sky-100 bg-white p-3 transition hover:border-sky-200 hover:bg-sky-50/50">
      <input
        className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600"
        name="items"
        type="checkbox"
        value={item.value}
      />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-900">{item.label}</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
              item.kind === "content"
                ? "border-sky-100 bg-sky-50 text-sky-700"
                : "border-indigo-100 bg-indigo-50 text-indigo-700",
            )}
          >
            {item.kind === "content" ? "Contenu" : "Quiz"}
          </span>
        </span>
        <span className="mt-1 block text-xs text-slate-500">{item.meta}</span>
        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
          {item.description}
        </span>
      </span>
    </label>
  );
}

export function LearningPathForm({
  cohorts,
  itemOptions,
}: {
  cohorts: CoachLearningPathData["cohorts"];
  itemOptions: CoachLearningPathData["itemOptions"];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createLearningPathAction,
    initialLearningPathActionState,
  );
  const canCreate = cohorts.length > 0 && itemOptions.length > 0;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Titre</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          disabled={!canCreate}
          name="title"
          placeholder="Ex : Parcours onboarding leadership"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Cohorte</span>
        <select
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          disabled={!canCreate}
          name="cohortId"
          required
        >
          <option value="">Choisir une cohorte</option>
          {cohorts.map((cohort) => (
            <option key={cohort.id} value={cohort.id}>
              {cohort.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Description</span>
        <textarea
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          disabled={!canCreate}
          name="description"
          placeholder="Objectif du parcours, rythme, consignes..."
        />
      </label>

      <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-4 w-4 text-sky-700" />
          <p className="text-sm font-semibold text-slate-900">
            Contenus et quiz du parcours
          </p>
        </div>
        <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto pr-1">
          {itemOptions.length ? (
            itemOptions.map((item) => <ItemCheckbox item={item} key={item.value} />)
          ) : (
            <p className="rounded-xl border border-dashed border-sky-200 bg-white p-4 text-sm leading-6 text-slate-500">
              Créez au moins un contenu ou un quiz avant de composer un parcours.
            </p>
          )}
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

      <SubmitButton disabled={!canCreate} />
    </form>
  );
}
