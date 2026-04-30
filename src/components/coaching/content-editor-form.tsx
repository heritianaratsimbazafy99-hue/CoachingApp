"use client";

import Link from "next/link";
import { UploadCloud } from "lucide-react";
import type { FormEvent } from "react";
import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  createContentFileUploadAction,
  initialSaveContentState,
  saveContentAction,
} from "@/app/coach/library/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type {
  CoachContent,
  CoachSubtheme,
  CoachTheme,
} from "@/services/coach-service";
import type { ContentStatus, ContentType } from "@/types/coaching";
import { cn } from "@/utils/cn";
import {
  CONTENT_FILE_ACCEPT,
  CONTENT_FILE_BUCKET,
  MAX_CONTENT_FILE_SIZE_BYTES,
  contentFileDownloadHref,
  getContentFileValidationError,
} from "@/utils/content-file-storage";
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

function SubmitButton({ isUploading }: { isUploading: boolean }) {
  const { pending } = useFormStatus();
  const disabled = pending || isUploading;

  return (
    <button
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled}
      type="submit"
    >
      {isUploading ? "Upload..." : pending ? "Enregistrement..." : "Enregistrer"}
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
  const [clientMessage, setClientMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedFileUrlRef = useRef<HTMLInputElement>(null);
  const skipUploadRef = useRef(false);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (skipUploadRef.current) {
      skipUploadRef.current = false;
      return;
    }

    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      return;
    }

    event.preventDefault();
    const form = event.currentTarget;
    setClientMessage("");

    const validationError = getContentFileValidationError({
      name: file.name,
      size: file.size,
      type: file.type,
    });

    if (validationError) {
      setClientMessage(validationError);
      return;
    }

    setIsUploading(true);

    const uploadRequest = new FormData();
    uploadRequest.set("contentId", content?.id ?? "");
    uploadRequest.set("fileName", file.name);
    uploadRequest.set("fileSize", String(file.size));
    uploadRequest.set("fileType", file.type);

    try {
      const uploadState = await createContentFileUploadAction(uploadRequest);

      if (
        uploadState.status !== "success" ||
        !uploadState.path ||
        !uploadState.storageRef ||
        !uploadState.token
      ) {
        setClientMessage(uploadState.message);
        return;
      }

      const { error } = await supabase.storage
        .from(CONTENT_FILE_BUCKET)
        .uploadToSignedUrl(uploadState.path, uploadState.token, file, {
          cacheControl: "3600",
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (error) {
        setClientMessage(error.message);
        return;
      }

      if (uploadedFileUrlRef.current) {
        uploadedFileUrlRef.current.value = uploadState.storageRef;
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      skipUploadRef.current = true;
      form.requestSubmit();
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      action={formAction}
      className="grid gap-6 rounded-xl border border-sky-100 bg-white/95 p-6 shadow-sm shadow-sky-900/5 lg:grid-cols-[1fr_320px]"
      onSubmit={handleSubmit}
    >
      <input name="contentId" type="hidden" value={content?.id ?? ""} />
      <input name="uploadedFileUrl" ref={uploadedFileUrlRef} type="hidden" />
      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Titre</span>
          <input
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            defaultValue={content?.title}
            name="title"
            placeholder="Titre du contenu"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            className="mt-2 min-h-24 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
            className="mt-2 min-h-64 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            defaultValue={content?.tags.join(", ")}
            name="tags"
            placeholder="mindset, onboarding, carrière"
          />
        </label>
      </div>

      <aside className="space-y-5 rounded-xl border border-sky-100 bg-sky-50/70 p-5">
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Type</span>
          <select
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
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
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            defaultValue={content?.videoUrl}
            name="videoUrl"
            placeholder="https://..."
            type="url"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700">Lien externe</span>
          <input
            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            defaultValue={content?.externalUrl}
            name="externalUrl"
            placeholder="https://..."
            type="url"
          />
        </label>

        <div className="rounded-xl border border-sky-100 bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
              <UploadCloud className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Document</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                PDF, Word, PowerPoint, Excel, TXT ou RTF. Maximum{" "}
                {Math.round(MAX_CONTENT_FILE_SIZE_BYTES / 1024 / 1024)} Mo.
              </p>
            </div>
          </div>

          {content?.fileUrl ? (
            <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <Link
                className="font-semibold underline-offset-2 hover:underline"
                href={contentFileDownloadHref(content.id)}
                target="_blank"
              >
                Ouvrir le document actuel
              </Link>
              <label className="mt-3 flex items-start gap-2 text-xs text-emerald-900">
                <input
                  className="mt-0.5 h-4 w-4 rounded border-emerald-200"
                  name="removeDocumentFile"
                  type="checkbox"
                />
                Supprimer ce document à l&apos;enregistrement
              </label>
            </div>
          ) : null}

          <input
            accept={CONTENT_FILE_ACCEPT}
            className="mt-3 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sky-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            name="documentFile"
            ref={fileInputRef}
            type="file"
          />
        </div>

        {state.message || clientMessage ? (
          <p
            className={cn(
              "rounded-lg border px-3 py-2 text-sm font-medium",
              state.status === "error" || clientMessage
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700",
            )}
          >
            {clientMessage || state.message}
          </p>
        ) : null}

        <SubmitButton isUploading={isUploading} />
      </aside>
    </form>
  );
}
