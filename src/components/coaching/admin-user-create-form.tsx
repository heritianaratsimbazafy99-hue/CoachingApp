"use client";

import { useActionState } from "react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { MailPlus, UserPlus } from "lucide-react";
import { createAdminUserAction } from "@/app/admin/actions";
import type { CreateAdminUserState } from "@/app/admin/actions";
import { buttonVariants } from "@/components/ui/button";
import { inputClassName, labelClassName } from "@/components/ui/form-field";
import { cn } from "@/utils/cn";

const roleOptions = [
  { label: "Coaché", value: "coachee" },
  { label: "Coach", value: "coach" },
  { label: "Admin", value: "admin" },
];

const initialCreateAdminUserState: CreateAdminUserState = {
  message: "",
  status: "idle",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={buttonVariants()}
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
  const [creationMode, setCreationMode] = useState<"invite" | "password">(
    "invite",
  );

  return (
    <form
      action={formAction}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-5"
    >
      <input name="creationMode" type="hidden" value={creationMode} />
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 md:col-span-2 xl:col-span-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-3 py-3 transition",
              creationMode === "invite"
                ? "border-sky-300 ring-4 ring-sky-100"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <input
              checked={creationMode === "invite"}
              className="mt-1 h-4 w-4 accent-sky-600"
              onChange={() => setCreationMode("invite")}
              type="radio"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <MailPlus className="h-4 w-4 text-sky-700" />
                Invitation email
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Le compte reçoit un lien Supabase pour définir son mot de passe.
              </span>
            </span>
          </label>
          <label
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-lg border bg-white px-3 py-3 transition",
              creationMode === "password"
                ? "border-sky-300 ring-4 ring-sky-100"
                : "border-slate-200 hover:border-slate-300",
            )}
          >
            <input
              checked={creationMode === "password"}
              className="mt-1 h-4 w-4 accent-sky-600"
              onChange={() => setCreationMode("password")}
              type="radio"
            />
            <span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <UserPlus className="h-4 w-4 text-sky-700" />
                Mot de passe temporaire
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                Conserve le flux actuel si vous devez créer l&apos;accès tout de suite.
              </span>
            </span>
          </label>
        </div>
      </div>
      <label className="block xl:col-span-2">
        <span className={labelClassName}>Nom complet</span>
        <input
          className={inputClassName("mt-1 min-h-10 px-3 py-2")}
          name="fullName"
          placeholder="Ex : Aina Rakoto"
          required
          type="text"
        />
      </label>
      <label className="block xl:col-span-2">
        <span className={labelClassName}>Email</span>
        <input
          className={inputClassName("mt-1 min-h-10 px-3 py-2")}
          name="email"
          placeholder="nom@entreprise.com"
          required
          type="email"
        />
      </label>
      <label className="block">
        <span className={labelClassName}>Rôle</span>
        <select
          className={inputClassName("mt-1 min-h-10 px-3 py-2")}
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
      {creationMode === "password" ? (
        <label className="block md:col-span-2 xl:col-span-4">
          <span className={labelClassName}>Mot de passe temporaire</span>
          <input
            className={inputClassName("mt-1 min-h-10 px-3 py-2")}
            minLength={8}
            name="password"
            placeholder="8 caractères minimum"
            required
            type="password"
          />
        </label>
      ) : (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800 md:col-span-2 xl:col-span-4">
          Aucun mot de passe à communiquer : Supabase enverra le lien
          d&apos;invitation à l&apos;adresse renseignée.
        </div>
      )}
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
