"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialUpdateUserRoleState,
  updateUserRoleAction,
} from "@/app/admin/actions";
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="rounded-lg border border-sky-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="min-h-10 rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
