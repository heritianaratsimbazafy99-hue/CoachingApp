"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MessageCircle, Send } from "lucide-react";
import {
  sendReminderTemplateAction,
  type CoachReminderActionState,
} from "@/app/coach/coachees/actions";
import type { CoachReminderTemplate } from "@/services/coach-service";
import { cn } from "@/utils/cn";

const initialReminderState: CoachReminderActionState = {
  message: "",
  status: "idle",
};

function ReminderSubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || pending}
      type="submit"
    >
      <Send className="h-4 w-4" />
      {pending ? "Envoi..." : "Relancer"}
    </button>
  );
}

export function CoacheeQuickActions({
  coacheeId,
  reminderTemplates,
}: {
  coacheeId: string;
  reminderTemplates: CoachReminderTemplate[];
}) {
  const [state, formAction] = useActionState(
    sendReminderTemplateAction,
    initialReminderState,
  );
  const hasTemplates = reminderTemplates.length > 0;

  return (
    <div className="space-y-2">
      <Link
        className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100"
        href={`/coach/messages?conversation=${coacheeId}`}
      >
        <MessageCircle className="h-4 w-4" />
        Message
      </Link>

      <form action={formAction} className="grid gap-2">
        <input name="coacheeId" type="hidden" value={coacheeId} />
        <select
          className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100 disabled:bg-slate-50 disabled:text-slate-400"
          disabled={!hasTemplates}
          name="templateId"
          required
        >
          {hasTemplates ? (
            reminderTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))
          ) : (
            <option>Aucun template</option>
          )}
        </select>
        <ReminderSubmitButton disabled={!hasTemplates} />
      </form>

      {state.message ? (
        <p
          className={cn(
            "rounded-lg border px-2.5 py-2 text-xs font-medium",
            state.status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
