"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound, MailPlus } from "lucide-react";
import {
  sendPasswordResetAction,
  sendUserInvitationAction,
} from "@/app/admin/actions";
import type { AdminAuthEmailState } from "@/app/admin/actions";
import { buttonVariants } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { cn } from "@/utils/cn";

type AdminUserOnboardingActionsProps = {
  userId: string;
};

const initialAdminAuthEmailState: AdminAuthEmailState = {
  message: "",
  status: "idle",
};

function InvitationSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({ size: "sm", variant: "secondary" }),
        "w-full justify-center sm:w-auto",
      )}
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
      className={cn(
        buttonVariants({ size: "sm", variant: "soft" }),
        "w-full justify-center border-emerald-100 bg-emerald-50 text-emerald-800 hover:border-emerald-200 hover:bg-emerald-100 sm:w-auto",
      )}
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
    <div className="min-w-0 space-y-2">
      <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <form action={inviteAction} className="min-w-0">
          <input name="userId" type="hidden" value={userId} />
          <InvitationSubmitButton />
        </form>
        <form action={resetAction} className="min-w-0">
          <input name="userId" type="hidden" value={userId} />
          <ResetSubmitButton />
        </form>
      </div>
      {visibleState ? (
        <FormStatusMessage
          compact
          message={visibleState.message}
          status={visibleState.status}
        />
      ) : null}
    </div>
  );
}
