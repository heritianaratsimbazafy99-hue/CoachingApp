"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";
import {
  sendMessageAction,
  type SendMessageState,
} from "@/app/messages/actions";
import { cn } from "@/utils/cn";

const initialSendMessageState: SendMessageState = {
  message: "",
  status: "idle",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-600 px-4 text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || pending}
      type="submit"
    >
      <Send className="h-4 w-4" />
      <span className="sr-only">{pending ? "Envoi..." : "Envoyer"}</span>
    </button>
  );
}

export function MessageComposerForm({
  receiverId,
}: {
  receiverId: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    sendMessageAction,
    initialSendMessageState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-2" ref={formRef}>
      <input name="receiverId" type="hidden" value={receiverId ?? ""} />
      <div className="flex gap-3">
        <textarea
          className="max-h-36 min-h-11 flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-5 outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          disabled={!receiverId}
          name="body"
          placeholder={
            receiverId
              ? "Écrire un message..."
              : "Sélectionnez une conversation"
          }
          rows={1}
        />
        <SubmitButton disabled={!receiverId} />
      </div>
      {state.message && state.status === "error" ? (
        <p
          className={cn(
            "rounded-xl border px-3 py-2 text-sm font-medium",
            "border-red-200 bg-red-50 text-red-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
