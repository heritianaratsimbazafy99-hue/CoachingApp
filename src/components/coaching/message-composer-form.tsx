"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import {
  sendMessageAction,
  type SendMessageState,
} from "@/app/messages/actions";
import { buttonVariants } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { textareaClassName } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const initialSendMessageState: SendMessageState = {
  message: "",
  status: "idle",
};

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({ size: "lg" }),
        "h-10 w-10 rounded-xl px-0 sm:h-11 sm:w-11",
      )}
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
  const router = useRouter();
  const [state, formAction] = useActionState(
    sendMessageAction,
    initialSendMessageState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, state.status]);

  return (
    <form action={formAction} className="space-y-2" ref={formRef}>
      <input name="receiverId" type="hidden" value={receiverId ?? ""} />
      <div className="flex min-w-0 items-end gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1.5 ring-1 ring-white sm:gap-3 sm:p-2">
        <textarea
          aria-label="Message"
          className={textareaClassName(
            "mt-0 max-h-32 min-h-10 min-w-0 flex-1 resize-none rounded-xl border-transparent bg-white py-2.5 leading-5 ring-0 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100 sm:max-h-36 sm:min-h-11 sm:py-3",
          )}
          disabled={!receiverId}
          maxLength={2000}
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
      {state.status === "error" ? (
        <FormStatusMessage message={state.message} status={state.status} />
      ) : null}
    </form>
  );
}
