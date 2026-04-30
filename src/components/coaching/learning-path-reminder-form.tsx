"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import {
  sendLearningPathReminderAction,
  type LearningPathReminderActionState,
} from "@/app/coach/paths/actions";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const initialReminderState: LearningPathReminderActionState = {
  message: "",
  status: "idle",
};

function ReminderSubmitButton({ sent }: { sent: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({ size: "sm", variant: "secondary" }),
        sent
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
          : "text-sky-700",
      )}
      disabled={pending || sent}
      type="submit"
    >
      <Send className="h-3.5 w-3.5" />
      {pending ? "Envoi..." : sent ? "Envoyé" : "Relancer"}
    </button>
  );
}

export function LearningPathReminderForm({
  coacheeId,
  pathTitle,
  reason,
  reminderType,
}: {
  coacheeId: string;
  pathTitle: string;
  reason: string;
  reminderType: "blocked" | "correction";
}) {
  const [state, formAction] = useActionState(
    sendLearningPathReminderAction,
    initialReminderState,
  );
  const sent = state.status === "success";

  return (
    <form action={formAction} className="flex flex-col items-end gap-1.5">
      <input name="coacheeId" type="hidden" value={coacheeId} />
      <input name="pathTitle" type="hidden" value={pathTitle} />
      <input name="reason" type="hidden" value={reason} />
      <input name="reminderType" type="hidden" value={reminderType} />
      <ReminderSubmitButton sent={sent} />
      {state.message ? (
        <p
          className={cn(
            "max-w-44 text-right text-xs font-medium leading-4",
            state.status === "error" ? "text-red-700" : "text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
