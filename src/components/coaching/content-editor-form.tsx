"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  initialSaveContentState,
  saveContentAction,
} from "@/app/coach/library/actions";
import type {
  CoachContent,
  CoachSubtheme,
  CoachTheme,
} from "@/services/coach-service";
import type { ContentStatus, ContentType } from "@/types/coaching";
import { cn } from "@/utils/cn";
import { contentTypeLabel } from "@/utils/format";

type ContentEditorFormProps = {
  content: CoachContent | null;
  subthemes: CoachSubtheme[];
  themes: CoachTheme[];
};

const contentTypes: ContentType[] = [
  "text",
  "video",
  "external_link",
  "document",
  "quiz",
];

const statusOptions: Array<{ label: string; value: ContentStatus }> = [
  { label: "Brouillon", value: "draft" },
  { label: "Publié", value: "published" },
];

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Enregistrement..." : "Enregistrer"}
    </button>
  );
}

export function ContentEditorForm({
  content,
  subthemes,
  themes,
}: ContentEditorFormProps) {
  const [state, formAction] = useActionState(
    saveContentAction,
    initialSaveContentState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr_320px]"
    >
      <input name="contentId" type="hidden" value={content?.id ?? ""} />
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Titre</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-950/10"
            defaultValue={content?.title}
            name="title"
            placeholder="Titre du contenu"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-950/10"
            defaultValue={content?.description}
            name="description"
            placeholder="Résumé court visible dans la bibliothèque"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Corps du cours
          </span>
          <textarea
            className="mt-2 min-h-64 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm leading-6 outline-none focus:ring-4 focus:ring-slate-950/10"
            defaultValue={content?.body}
            name="body"
            placeholder="Texte, consignes, ressources et liens utiles."
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Tags, séparés par des virgules
          </span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-950/10"
            defaultValue={content?.tags.join(", ")}
            name="tags"
            placeholder="mindset, onboarding, carrière"
          />
        </label>
      </div>

      <aside className="space-y-5 rounded-xl bg-slate-50 p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Type</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.type ?? "text"}
            name="type"
          >
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {contentTypeLabel[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Statut</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.status ?? "draft"}
            name="status"
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Thème</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.themeId ?? ""}
            name="themeId"
          >
            <option value="">Sans thème</option>
            {themes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Sous-thème</span>
          <select
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.subthemeId ?? ""}
            name="subthemeId"
          >
            <option value="">Sans sous-thème</option>
            {subthemes.map((subtheme) => (
              <option key={subtheme.id} value={subtheme.id}>
                {subtheme.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">URL vidéo</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.videoUrl}
            name="videoUrl"
            placeholder="https://..."
            type="url"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Lien externe</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.externalUrl}
            name="externalUrl"
            placeholder="https://..."
            type="url"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">URL document</span>
          <input
            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
            defaultValue={content?.fileUrl}
            name="fileUrl"
            placeholder="https://..."
            type="url"
          />
        </label>

        {state.message ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium",
              state.status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-600",
            )}
          >
            {state.message}
          </p>
        ) : null}

        <SubmitButton />
      </aside>
    </form>
  );
}
