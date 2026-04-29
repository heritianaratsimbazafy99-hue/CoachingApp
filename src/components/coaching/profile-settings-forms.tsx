"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Save, SendHorizonal, Trash2 } from "lucide-react";
import {
  createReminderTemplateAction,
  deleteReminderTemplateAction,
  type ProfileActionState,
  type ReminderTemplateActionState,
  updateProfileAction,
} from "@/app/profile/actions";
import type {
  AccountProfile,
  ReminderTemplate,
} from "@/services/profile-service";
import { cn } from "@/utils/cn";

const initialProfileState: ProfileActionState = {
  message: "",
  status: "idle",
};

const initialTemplateState: ReminderTemplateActionState = {
  message: "",
  status: "idle",
};

function StateMessage({
  message,
  status,
}: {
  message: string;
  status: "error" | "idle" | "success";
}) {
  if (!message) {
    return null;
  }

  return (
    <p
      className={cn(
        "rounded-xl border px-3 py-2 text-sm font-medium",
        status === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {message}
    </p>
  );
}

function ProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" />
      {pending ? "Enregistrement..." : "Enregistrer"}
    </button>
  );
}

function TemplateSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <SendHorizonal className="h-4 w-4" />
      {pending ? "Création..." : "Créer le template"}
    </button>
  );
}

export function ProfileForm({ profile }: { profile: AccountProfile }) {
  const [state, formAction] = useActionState(
    updateProfileAction,
    initialProfileState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Nom complet</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          defaultValue={profile.fullName}
          name="fullName"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Email</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
          defaultValue={profile.email}
          disabled
          type="email"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Avatar URL</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          defaultValue={profile.avatarUrl}
          name="avatarUrl"
          placeholder="https://..."
          type="url"
        />
      </label>

      <StateMessage message={state.message} status={state.status} />
      <ProfileSubmitButton />
    </form>
  );
}

export function ReminderTemplateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(
    createReminderTemplateAction,
    initialTemplateState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form action={formAction} className="space-y-4" ref={formRef}>
      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Titre</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          name="title"
          placeholder="Ex : Relance quiz en retard"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-800">Message</span>
        <textarea
          className="mt-2 min-h-32 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          name="body"
          placeholder="Bonjour, petit rappel..."
          required
        />
      </label>

      <StateMessage message={state.message} status={state.status} />
      <TemplateSubmitButton />
    </form>
  );
}

export function ReminderTemplateList({
  templates,
}: {
  templates: ReminderTemplate[];
}) {
  if (!templates.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500">
        Aucun template de relance. Créez vos messages réutilisables pour les
        retards, quiz à corriger ou sessions à venir.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <article
          className="rounded-xl border border-slate-200 bg-white p-4"
          key={template.id}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-950">{template.title}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {template.body}
              </p>
            </div>
            <form action={deleteReminderTemplateAction}>
              <input name="templateId" type="hidden" value={template.id} />
              <button
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 transition hover:bg-rose-100"
                title="Supprimer"
                type="submit"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        </article>
      ))}
    </div>
  );
}
