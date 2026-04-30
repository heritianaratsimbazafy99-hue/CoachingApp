"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Plus, Save, Trash2, UserMinus, UserPlus } from "lucide-react";
import {
  addAdminCohortMemberAction,
  createAdminCohortAction,
  deleteAdminCohortAction,
  removeAdminCohortMemberAction,
  updateAdminCohortAction,
} from "@/app/admin/cohorts/actions";
import type { AdminCohortActionState } from "@/app/admin/cohorts/actions";
import type { AdminCohort, AdminUser } from "@/services/admin-service";
import { buttonVariants } from "@/components/ui/button";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

type AdminCohortFormProps = {
  coaches: AdminUser[];
};

type AdminCohortEditFormProps = AdminCohortFormProps & {
  cohort: AdminCohort;
};

type AdminCohortMemberFormProps = {
  cohortId: string;
  options: AdminUser[];
};

type AdminCohortMemberRemoveFormProps = {
  cohortId: string;
  memberId: string;
};

const initialAdminCohortActionState: AdminCohortActionState = {
  message: "",
  status: "idle",
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

function SubmitButton({
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
  type: "add" | "delete" | "save";
}) {
  const { pending } = useFormStatus();
  const Icon = type === "delete" ? Trash2 : type === "save" ? Save : Plus;

  return (
    <button
      className={cn(
        buttonVariants({
          variant:
            tone === "danger"
              ? "danger"
              : tone === "secondary"
                ? "secondary"
                : "primary",
        }),
      )}
      disabled={disabled || pending}
      type="submit"
    >
      <Icon className="h-4 w-4" />
      {pending ? loadingLabel : label}
    </button>
  );
}

function RemoveMemberSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      aria-label="Retirer le coaché"
      className={cn(buttonVariants({ size: "sm", variant: "danger" }), "h-9 w-9 px-0")}
      disabled={pending}
      title="Retirer le coaché"
      type="submit"
    >
      <UserMinus className="h-4 w-4" />
    </button>
  );
}

function CoachSelect({
  coaches,
  currentCoachId,
}: {
  coaches: AdminUser[];
  currentCoachId?: string;
}) {
  const hasCurrentCoach = currentCoachId
    ? coaches.some((coach) => coach.id === currentCoachId)
    : true;

  return (
    <select
      className={inputClassName("px-3 py-2")}
      defaultValue={currentCoachId ?? ""}
      disabled={!coaches.length}
      name="coachId"
      required
    >
      <option value="">Choisir un coach</option>
      {!hasCurrentCoach && currentCoachId ? (
        <option value={currentCoachId}>Coach actuel indisponible</option>
      ) : null}
      {coaches.map((coach) => (
        <option key={coach.id} value={coach.id}>
          {coach.fullName} · {coach.email}
        </option>
      ))}
    </select>
  );
}

export function AdminCohortCreateForm({ coaches }: AdminCohortFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createAdminCohortAction,
    initialAdminCohortActionState,
  );
  const hasCoaches = coaches.length > 0;

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
          className={inputClassName("px-3 py-2")}
          name="name"
          placeholder="Cohorte Leadership Q2"
          required
        />
      </label>

      <label className="block">
        <span className={labelClassName}>Coach</span>
        <CoachSelect coaches={coaches} />
      </label>

      <label className="block">
        <span className={labelClassName}>Description</span>
        <textarea
          className={textareaClassName("min-h-24 px-3 py-2")}
          name="description"
          placeholder="Objectifs, rythme, périmètre..."
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Début</span>
          <input
            className={inputClassName("px-3 py-2")}
            name="startDate"
            type="date"
          />
        </label>
        <label className="block">
          <span className={labelClassName}>Fin</span>
          <input
            className={inputClassName("px-3 py-2")}
            name="endDate"
            type="date"
          />
        </label>
      </div>

      {!hasCoaches ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Créez au moins un utilisateur coach avant d&apos;ouvrir une cohorte.
        </p>
      ) : null}

      <ActionMessage message={state.message} status={state.status} />

      <div className="flex justify-end">
        <SubmitButton
          disabled={!hasCoaches}
          label="Créer la cohorte"
          loadingLabel="Création..."
          type="add"
        />
      </div>
    </form>
  );
}

export function AdminCohortEditForm({
  coaches,
  cohort,
}: AdminCohortEditFormProps) {
  const [state, formAction] = useActionState(
    updateAdminCohortAction,
    initialAdminCohortActionState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input name="cohortId" type="hidden" value={cohort.id} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Nom</span>
          <input
            className={inputClassName("px-3 py-2")}
            defaultValue={cohort.name}
            name="name"
            required
          />
        </label>
        <label className="block">
          <span className={labelClassName}>Coach</span>
          <CoachSelect coaches={coaches} currentCoachId={cohort.coachId} />
        </label>
      </div>

      <label className="block">
        <span className={labelClassName}>Description</span>
        <textarea
          className={textareaClassName("min-h-20 px-3 py-2")}
          defaultValue={cohort.description}
          name="description"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={labelClassName}>Début</span>
          <input
            className={inputClassName("px-3 py-2")}
            defaultValue={cohort.startDate ?? ""}
            name="startDate"
            type="date"
          />
        </label>
        <label className="block">
          <span className={labelClassName}>Fin</span>
          <input
            className={inputClassName("px-3 py-2")}
            defaultValue={cohort.endDate ?? ""}
            name="endDate"
            type="date"
          />
        </label>
      </div>

      <ActionMessage message={state.message} status={state.status} />

      <div className="flex justify-end">
        <SubmitButton
          disabled={!coaches.length}
          label="Enregistrer"
          loadingLabel="Enregistrement..."
          type="save"
        />
      </div>
    </form>
  );
}

export function AdminCohortDeleteForm({ cohort }: { cohort: AdminCohort }) {
  const [state, formAction] = useActionState(
    deleteAdminCohortAction,
    initialAdminCohortActionState,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Supprimer définitivement la cohorte "${cohort.name}" ?`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input name="cohortId" type="hidden" value={cohort.id} />
      <SubmitButton
        label="Supprimer"
        loadingLabel="Suppression..."
        tone="danger"
        type="delete"
      />
      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}

export function AdminCohortMemberForm({
  cohortId,
  options,
}: AdminCohortMemberFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    addAdminCohortMemberAction,
    initialAdminCohortActionState,
  );
  const hasOptions = options.length > 0;

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-3" ref={formRef}>
      <input name="cohortId" type="hidden" value={cohortId} />
      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <select
          className={inputClassName("mt-0 min-h-10 px-3 py-2")}
          disabled={!hasOptions}
          name="userId"
          required
        >
          {hasOptions ? (
            <>
              <option value="">Ajouter un coaché</option>
              {options.map((coachee) => (
                <option key={coachee.id} value={coachee.id}>
                  {coachee.fullName} · {coachee.email}
                </option>
              ))}
            </>
          ) : (
            <option value="">Tous les coachés sont déjà membres</option>
          )}
        </select>
        <button
          className={buttonVariants({ size: "md" })}
          disabled={!hasOptions}
          type="submit"
        >
          <UserPlus className="h-4 w-4" />
          Ajouter
        </button>
      </div>
      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}

export function AdminCohortMemberRemoveForm({
  cohortId,
  memberId,
}: AdminCohortMemberRemoveFormProps) {
  const [state, formAction] = useActionState(
    removeAdminCohortMemberAction,
    initialAdminCohortActionState,
  );

  return (
    <form
      action={formAction}
      className="space-y-2"
      onSubmit={(event) => {
        if (!window.confirm("Retirer ce coaché de la cohorte ?")) {
          event.preventDefault();
        }
      }}
    >
      <input name="cohortId" type="hidden" value={cohortId} />
      <input name="userId" type="hidden" value={memberId} />
      <RemoveMemberSubmitButton />
      <ActionMessage message={state.message} status={state.status} />
    </form>
  );
}
