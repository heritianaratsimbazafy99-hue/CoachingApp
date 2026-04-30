"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Power, RotateCcw, ShieldCheck, UserPlus } from "lucide-react";
import {
  assignAdminCoacheeToCohortAction,
  changeAdminCoacheeCoachAction,
  initialAdminCoacheeActionState,
  toggleAdminCoacheeStatusAction,
} from "@/app/admin/coachees/actions";
import type {
  AdminCoacheeAssignment,
  AdminCohort,
  AdminUser,
} from "@/services/admin-service";
import { cn } from "@/utils/cn";

type AssignCoacheeFormProps = {
  coachee: AdminCoacheeAssignment;
  cohorts: AdminCohort[];
};

type ChangeCoachFormProps = {
  coaches: AdminUser[];
  coachee: AdminCoacheeAssignment;
};

type ToggleCoacheeStatusFormProps = {
  coachee: AdminCoacheeAssignment;
};

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
        "rounded-lg border px-3 py-2 text-xs font-medium",
        status === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {message}
    </p>
  );
}

function InlineSubmitButton({
  disabled = false,
  label,
  loadingLabel,
  tone = "primary",
  type,
}: {
  disabled?: boolean;
  label: string;
  loadingLabel: string;
  tone?: "danger" | "primary" | "secondary";
  type: "assign" | "coach" | "toggle";
}) {
  const { pending } = useFormStatus();
  const Icon =
    type === "assign" ? UserPlus : type === "coach" ? ShieldCheck : Power;

  return (
    <button
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        tone === "danger"
          ? "border border-red-100 bg-red-50 text-red-700 hover:bg-red-100"
          : tone === "secondary"
            ? "border border-emerald-100 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border border-sky-600 bg-sky-600 text-white shadow-sm shadow-sky-900/10 hover:bg-sky-700",
      )}
      disabled={disabled || pending}
      type="submit"
    >
      <Icon className="h-4 w-4" />
      {pending ? loadingLabel : label}
    </button>
  );
}

export function AssignCoacheeToCohortForm({
  coachee,
  cohorts,
}: AssignCoacheeFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    assignAdminCoacheeToCohortAction,
    initialAdminCoacheeActionState,
  );
  const assignedCohortIds = new Set(
    coachee.cohorts.map((cohort) => cohort.id),
  );
  const availableCohorts = cohorts.filter(
    (cohort) => !assignedCohortIds.has(cohort.id),
  );
  const hasOptions = availableCohorts.length > 0;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-2" ref={formRef}>
      <input name="userId" type="hidden" value={coachee.id} />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          className="min-h-10 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          disabled={!hasOptions}
          name="cohortId"
          required
        >
          {hasOptions ? (
            <>
              <option value="">Assigner à une cohorte</option>
              {availableCohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} · {cohort.coachName}
                </option>
              ))}
            </>
          ) : (
            <option value="">Toutes les cohortes sont déjà liées</option>
          )}
        </select>
        <InlineSubmitButton
          disabled={!hasOptions}
          label="Assigner"
          loadingLabel="Assignation..."
          type="assign"
        />
      </div>
      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}

export function ChangeCoacheeCoachForm({
  coaches,
  coachee,
}: ChangeCoachFormProps) {
  const [state, formAction] = useActionState(
    changeAdminCoacheeCoachAction,
    initialAdminCoacheeActionState,
  );
  const hasCohorts = coachee.cohorts.length > 0;
  const hasCoaches = coaches.length > 0;

  return (
    <form action={formAction} className="space-y-2">
      <input name="userId" type="hidden" value={coachee.id} />
      <div className="grid gap-2 xl:grid-cols-[1fr_1fr_auto]">
        <select
          className="min-h-10 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          disabled={!hasCohorts}
          name="cohortId"
          required
        >
          {hasCohorts ? (
            <>
              <option value="">Cohorte concernée</option>
              {coachee.cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name} · coach actuel : {cohort.coachName}
                </option>
              ))}
            </>
          ) : (
            <option value="">Assignez d&apos;abord une cohorte</option>
          )}
        </select>
        <select
          className="min-h-10 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          disabled={!hasCoaches}
          name="coachId"
          required
        >
          {hasCoaches ? (
            <>
              <option value="">Nouveau coach</option>
              {coaches.map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.fullName} · {coach.email}
                </option>
              ))}
            </>
          ) : (
            <option value="">Aucun coach actif</option>
          )}
        </select>
        <InlineSubmitButton
          disabled={!hasCohorts || !hasCoaches}
          label="Changer"
          loadingLabel="Mise à jour..."
          type="coach"
        />
      </div>
      <p className="text-xs leading-5 text-slate-500">
        Le changement s&apos;applique au coach responsable de la cohorte
        sélectionnée.
      </p>
      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}

export function ToggleCoacheeStatusForm({
  coachee,
}: ToggleCoacheeStatusFormProps) {
  const [state, formAction] = useActionState(
    toggleAdminCoacheeStatusAction,
    initialAdminCoacheeActionState,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        const message = coachee.isDisabled
          ? `Réactiver le compte de ${coachee.fullName} ?`
          : `Désactiver le compte de ${coachee.fullName} ?`;

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      <input name="userId" type="hidden" value={coachee.id} />
      <input
        name="statusAction"
        type="hidden"
        value={coachee.isDisabled ? "enable" : "disable"}
      />
      <InlineSubmitButton
        label={coachee.isDisabled ? "Réactiver" : "Désactiver"}
        loadingLabel="Mise à jour..."
        tone={coachee.isDisabled ? "secondary" : "danger"}
        type="toggle"
      />
      {coachee.isDisabled ? (
        <p className="inline-flex items-center gap-1 text-xs text-emerald-700">
          <RotateCcw className="h-3.5 w-3.5" />
          Le compte est actuellement bloqué côté Supabase Auth.
        </p>
      ) : null}
      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}
