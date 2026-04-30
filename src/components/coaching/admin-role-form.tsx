"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateUserRoleAction } from "@/app/admin/actions";
import type { UpdateUserRoleState } from "@/app/admin/actions";
import { buttonVariants } from "@/components/ui/button";
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
      className={buttonVariants({ variant: "secondary" })}
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
    <form action={formAction} className="space-y-2">
      <input name="userId" type="hidden" value={userId} />
      <div className="flex flex-col gap-2 sm:flex-row">
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
      {state.message ? (
        <p
          className={cn(
            "text-xs font-medium",
            state.status === "error" ? "text-red-600" : "text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
