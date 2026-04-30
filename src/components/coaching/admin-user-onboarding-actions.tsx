"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, MailPlus } from "lucide-react";
import {
  initialAdminAuthEmailState,
  sendPasswordResetAction,
  sendUserInvitationAction,
} from "@/app/admin/actions";
import { cn } from "@/utils/cn";

type AdminUserOnboardingActionsProps = {
  userId: string;
};

function InvitationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-sky-100 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <MailPlus className="h-3.5 w-3.5" />
      {pending ? "Envoi..." : "Renvoyer invitation"}
    </button>
  );
}

function ResetSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <KeyRound className="h-3.5 w-3.5" />
      {pending ? "Envoi..." : "Réinitialiser mot de passe"}
    </button>
  );
}

export function AdminUserOnboardingActions({
  userId,
}: AdminUserOnboardingActionsProps) {
  const [inviteState, inviteAction] = useActionState(
    sendUserInvitationAction,
    initialAdminAuthEmailState,
  );
  const [resetState, resetAction] = useActionState(
    sendPasswordResetAction,
    initialAdminAuthEmailState,
  );
  const visibleState =
    resetState.status !== "idle"
      ? resetState
      : inviteState.status !== "idle"
        ? inviteState
        : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={inviteAction}>
          <input name="userId" type="hidden" value={userId} />
          <InvitationSubmitButton />
        </form>
        <form action={resetAction}>
          <input name="userId" type="hidden" value={userId} />
          <ResetSubmitButton />
        </form>
      </div>
      {visibleState ? (
        <p
          className={cn(
            "text-xs font-medium",
            visibleState.status === "error"
              ? "text-red-600"
              : "text-emerald-700",
          )}
        >
          {visibleState.message}
        </p>
      ) : null}
    </div>
  );
}
