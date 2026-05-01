"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import {
  createCalendarEventAction,
  type CreateCalendarEventState,
} from "@/app/coach/calendar/actions";
import { buttonVariants } from "@/components/ui/button";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/ui/form-field";
import type { CalendarTargetOption } from "@/services/calendar-service";
import { cn } from "@/utils/cn";
import { eventTypeLabel } from "@/utils/format";

const eventTypes = [
  "individual_coaching",
  "collective_workshop",
  "info_meeting",
  "reminder",
] as const;

const initialCreateCalendarEventState: CreateCalendarEventState = {
  message: "",
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(buttonVariants({ size: "lg" }), "w-full")}
      disabled={pending}
      type="submit"
    >
      <CalendarPlus className="h-4 w-4" />
      {pending ? "Création..." : "Créer l'événement"}
    </button>
  );
}

export function CalendarEventForm({
  targetOptions,
}: {
  targetOptions: CalendarTargetOption[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createCalendarEventAction,
    initialCreateCalendarEventState,
  );
  const coachees = targetOptions.filter((target) => target.type === "coachee");
  const cohorts = targetOptions.filter((target) => target.type === "cohort");

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <label className="block">
        <span className={labelClassName}>Titre</span>
        <input
          className={inputClassName()}
          name="title"
          placeholder="Ex : Session objectifs Q2"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <label className="block">
          <span className={labelClassName}>Type</span>
          <select
            className={inputClassName()}
            defaultValue="individual_coaching"
            name="type"
          >
            {eventTypes.map((type) => (
              <option key={type} value={type}>
                {eventTypeLabel[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className={labelClassName}>Cible</span>
          <select
            className={inputClassName()}
            defaultValue="coach"
            name="target"
            required
          >
            <option value="coach">Coach seul</option>
            {coachees.length ? (
              <optgroup label="Coachés">
                {coachees.map((target) => (
                  <option key={target.value} value={target.value}>
                    {target.label}
                  </option>
                ))}
              </optgroup>
            ) : null}
            {cohorts.length ? (
              <optgroup label="Cohortes">
                {cohorts.map((target) => (
                  <option key={target.value} value={target.value}>
                    {target.label}
                  </option>
                ))}
              </optgroup>
            ) : null}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <label className="block">
          <span className={labelClassName}>Début</span>
          <input
            className={inputClassName()}
            name="startAt"
            required
            type="datetime-local"
          />
        </label>

        <label className="block">
          <span className={labelClassName}>Fin</span>
          <input
            className={inputClassName()}
            name="endAt"
            required
            type="datetime-local"
          />
        </label>
      </div>

      <label className="block">
        <span className={labelClassName}>Description</span>
        <textarea
          className={textareaClassName()}
          name="description"
          placeholder="Contexte, objectif, lien de visio..."
        />
      </label>

      {state.message ? (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-medium ring-1 ring-white",
            state.status === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
