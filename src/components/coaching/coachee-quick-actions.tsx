"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MessageCircle, Send } from "lucide-react";
import {
  sendReminderTemplateAction,
  type CoachReminderActionState,
} from "@/app/coach/coachees/actions";
import { buttonVariants } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { inputClassName } from "@/components/ui/form-field";
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
      className={cn(buttonVariants({ size: "sm" }), "w-full")}
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
        className={cn(buttonVariants({ variant: "soft" }), "w-full")}
        href={`/coach/messages?conversation=${coacheeId}`}
      >
        <MessageCircle className="h-4 w-4" />
        Message
      </Link>

      <form action={formAction} className="grid gap-2">
        <input name="coacheeId" type="hidden" value={coacheeId} />
        <select
          className={inputClassName("mt-0 min-h-10 px-3 py-2")}
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

      <FormStatusMessage compact message={state.message} status={state.status} />
    </div>
  );
}
