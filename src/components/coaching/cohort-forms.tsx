"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus, UserMinus, UserPlus } from "lucide-react";
import {
  addCohortMemberAction,
  createCohortAction,
  removeCohortMemberAction,
} from "@/app/coach/cohorts/actions";
import type { CohortActionState } from "@/app/coach/cohorts/actions";
import type { CoachCoacheeSummary } from "@/services/coach-service";
import { cn } from "@/utils/cn";

const initialCohortActionState: CohortActionState = {
  message: "",
  status: "idle",
};

function CohortSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Plus className="h-4 w-4" />
      {pending ? "Création..." : "Créer la cohorte"}
    </button>
  );
}

function AddMemberSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      <UserPlus className="h-4 w-4" />
      {pending ? "Ajout..." : "Ajouter"}
    </button>
  );
}

function RemoveMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label="Retirer le membre"
      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      title="Retirer le membre"
      type="submit"
    >
      <UserMinus className="h-4 w-4" />
    </button>
  );
}

function ActionMessage({
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

export function CreateCohortForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createCohortAction,
    initialCohortActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Nom</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="name"
          placeholder="Ex : Cohorte Leadership Q2"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Description</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="description"
          placeholder="Objectifs, audience, rythme de suivi..."
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Début</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            name="startDate"
            type="date"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Fin</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            name="endDate"
            type="date"
          />
        </label>
      </div>

      <ActionMessage message={state.message} status={state.status} />

      <div className="flex justify-end">
        <CohortSubmitButton />
      </div>
    </form>
  );
}

export function AddCohortMemberForm({
  cohortId,
  options,
}: {
  cohortId: string;
  options: CoachCoacheeSummary[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    addCohortMemberAction,
    initialCohortActionState,
  );
  const hasOptions = options.length > 0;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-sky-100 bg-sky-50/60 p-4"
      ref={formRef}
    >
      <input name="cohortId" type="hidden" value={cohortId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">
            Ajouter un coaché
          </span>
          <select
            className="mt-2 w-full rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            disabled={!hasOptions}
            name="userId"
            required
          >
            {hasOptions ? (
              <>
                <option value="">Choisir un coaché</option>
                {options.map((coachee) => (
                  <option key={coachee.id} value={coachee.id}>
                    {coachee.fullName} · {coachee.email}
                  </option>
                ))}
              </>
            ) : (
              <option value="">Tous les coachés disponibles sont déjà membres</option>
            )}
          </select>
        </label>
        <div className="flex items-end">
          <AddMemberSubmitButton disabled={!hasOptions} />
        </div>
      </div>

      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}

export function RemoveCohortMemberButton({
  cohortId,
  userId,
}: {
  cohortId: string;
  userId: string;
}) {
  return (
    <form
      action={removeCohortMemberAction}
      onSubmit={(event) => {
        if (!window.confirm("Retirer ce coaché de la cohorte ?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="cohortId" type="hidden" value={cohortId} />
      <input name="userId" type="hidden" value={userId} />
      <RemoveMemberSubmitButton />
    </form>
  );
}
