"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CalendarPlus } from "lucide-react";
import {
  createCalendarEventAction,
  type CreateCalendarEventState,
} from "@/app/coach/calendar/actions";
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
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
        <span className="text-sm font-semibold text-slate-800">Titre</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="title"
          placeholder="Ex : Session objectifs Q2"
          required
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Type</span>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
          <span className="text-sm font-semibold text-slate-800">Cible</span>
          <select
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
          <span className="text-sm font-semibold text-slate-800">Début</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            name="startAt"
            required
            type="datetime-local"
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-slate-800">Fin</span>
          <input
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            name="endAt"
            required
            type="datetime-local"
          />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Description</span>
        <textarea
          className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="description"
          placeholder="Contexte, objectif, lien de visio..."
        />
      </label>

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

      <SubmitButton />
    </form>
  );
}
