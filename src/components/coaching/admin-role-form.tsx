"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateUserRoleAction } from "@/app/admin/actions";
import type { UpdateUserRoleState } from "@/app/admin/actions";
import { buttonVariants } from "@/components/ui/button";
import { FormStatusMessage } from "@/components/ui/form-status-message";
import { inputClassName } from "@/components/ui/form-field";
import type { UserRole } from "@/types/coaching";
import { cn } from "@/utils/cn";

type AdminRoleFormProps = {
  currentRole: UserRole;
  userId: string;
};

const roleOptions: Array<{ label: string; value: UserRole }> = [
  { label: "Admin", value: "admin" },
  { label: "Coach", value: "coach" },
  { label: "Coaché", value: "coachee" },
];

const initialUpdateUserRoleState: UpdateUserRoleState = {
  message: "",
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        buttonVariants({ variant: "secondary" }),
        "w-full sm:w-auto",
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? "Maj..." : "Enregistrer"}
    </button>
  );
}

export function AdminRoleForm({ currentRole, userId }: AdminRoleFormProps) {
  const [state, formAction] = useActionState(
    updateUserRoleAction,
    initialUpdateUserRoleState,
  );

  return (
    <form action={formAction} className="min-w-0 space-y-2">
      <input name="userId" type="hidden" value={userId} />
      <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          className={inputClassName("mt-0 min-h-10 py-2")}
          defaultValue={currentRole}
          name="role"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SubmitButton />
      </div>
      <FormStatusMessage compact message={state.message} status={state.status} />
    </form>
  );
}
