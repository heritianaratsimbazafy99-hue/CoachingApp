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
      className={cn(buttonVariants({ size: "lg" }), "h-11 w-11 rounded-xl px-0")}
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
      <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-2 ring-1 ring-white">
        <textarea
          className={textareaClassName(
            "mt-0 max-h-36 min-h-11 flex-1 resize-none rounded-xl border-transparent bg-white py-3 leading-5 ring-0 focus:bg-white focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100",
          )}
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
            "rounded-xl border px-3 py-2 text-sm font-medium ring-1 ring-white",
            "border-rose-200 bg-rose-50 text-rose-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
