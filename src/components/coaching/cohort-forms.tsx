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
import { buttonVariants } from "@/components/ui/button";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
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
      className={buttonVariants({ size: "lg" })}
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
      className={buttonVariants({ size: "lg" })}
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
      className={cn(
        buttonVariants({ size: "sm", variant: "danger" }),
        "h-10 w-10 px-0",
      )}
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
        "rounded-xl border px-3 py-2 text-sm font-medium ring-1",
        status === "error"
          ? "border-rose-200 bg-rose-50 text-rose-700 ring-rose-100"
          : "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100",
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
        <span className={labelClassName}>Nom</span>
        <input
          className={inputClassName()}
          name="name"
          placeholder="Ex : Cohorte Leadership Q2"
          required
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Description</span>
        <textarea
          className={textareaClassName()}
          name="description"
          placeholder="Objectifs, audience, rythme de suivi..."
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Début</span>
          <input className={inputClassName()} name="startDate" type="date" />
        </label>

        <label className="block">
          <span className={labelClassName}>Fin</span>
          <input className={inputClassName()} name="endDate" type="date" />
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
      className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-4 ring-1 ring-white"
      ref={formRef}
    >
      <input name="cohortId" type="hidden" value={cohortId} />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="block">
          <span className={labelClassName}>Ajouter un coaché</span>
          <select
            className={inputClassName()}
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
