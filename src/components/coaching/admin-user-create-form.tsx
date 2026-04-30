"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { UserPlus } from "lucide-react";
import {
  createAdminUserAction,
  initialCreateAdminUserState,
} from "@/app/admin/actions";
import { cn } from "@/utils/cn";

const roleOptions = [
  { label: "Coaché", value: "coachee" },
  { label: "Coach", value: "coach" },
  { label: "Admin", value: "admin" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white shadow-sm shadow-sky-900/10 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <UserPlus className="h-4 w-4" />
      {pending ? "Création..." : "Créer l'utilisateur"}
    </button>
  );
}

export function AdminUserCreateForm() {
  const [state, formAction] = useActionState(
    createAdminUserAction,
    initialCreateAdminUserState,
  );

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <label className="block xl:col-span-2">
        <span className="text-sm font-medium text-slate-700">Nom complet</span>
        <input
          className="mt-1 min-h-10 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="fullName"
          placeholder="Ex : Aina Rakoto"
          required
          type="text"
        />
      </label>
      <label className="block xl:col-span-2">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          className="mt-1 min-h-10 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          name="email"
          placeholder="nom@entreprise.com"
          required
          type="email"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Rôle</span>
        <select
          className="mt-1 min-h-10 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          defaultValue="coachee"
          name="role"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block md:col-span-2 xl:col-span-4">
        <span className="text-sm font-medium text-slate-700">
          Mot de passe temporaire
        </span>
        <input
          className="mt-1 min-h-10 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
          minLength={8}
          name="password"
          placeholder="8 caractères minimum"
          required
          type="password"
        />
      </label>
      <div className="flex items-end">
        <SubmitButton />
      </div>
      {state.message ? (
        <p
          className={cn(
            "md:col-span-2 xl:col-span-5 text-sm font-medium",
            state.status === "error" ? "text-red-600" : "text-emerald-700",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
