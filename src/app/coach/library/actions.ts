"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const optionalUuid = z
  .string()
  .trim()
  .refine((value) => value === "" || uuidPattern.test(value), {
    message: "Identifiant invalide.",
  });

const contentSchema = z.object({
  body: z.string().trim().optional(),
  contentId: optionalUuid,
  description: z.string().trim().optional(),
  externalUrl: z.string().trim().optional(),
  fileUrl: z.string().trim().optional(),
  status: z.enum(["draft", "published"]),
  subthemeId: optionalUuid,
  tags: z.string().trim().optional(),
  themeId: optionalUuid,
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères."),
  type: z.enum(["text", "video", "external_link", "document", "quiz"]),
  videoUrl: z.string().trim().optional(),
});

export type SaveContentState = {
  message: string;
  status: "error" | "idle";
};

export const initialSaveContentState: SaveContentState = {
  message: "",
  status: "idle",
};

function nullableText(value: string | undefined) {
  return value?.trim() ? value.trim() : null;
}

function nullableUuid(value: string) {
  return value ? value : null;
}

function parseTags(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((tag) => tag.trim())
      .filter(Boolean) ?? []
  );
}

export async function saveContentAction(
  _previousState: SaveContentState,
  formData: FormData,
): Promise<SaveContentState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = contentSchema.safeParse({
    body: formData.get("body"),
    contentId: formData.get("contentId"),
    description: formData.get("description"),
    externalUrl: formData.get("externalUrl"),
    fileUrl: formData.get("fileUrl"),
    status: formData.get("status"),
    subthemeId: formData.get("subthemeId"),
    tags: formData.get("tags"),
    themeId: formData.get("themeId"),
    title: formData.get("title"),
    type: formData.get("type"),
    videoUrl: formData.get("videoUrl"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Certains champs du contenu sont invalides.",
      status: "error",
    };
  }

  const values = parsed.data;
  const supabase = await createServerSupabaseClient();
  const payload = {
    body: nullableText(values.body),
    description: nullableText(values.description),
    external_url: nullableText(values.externalUrl),
    file_url: nullableText(values.fileUrl),
    status: values.status,
    subtheme_id: nullableUuid(values.subthemeId),
    tags: parseTags(values.tags),
    theme_id: nullableUuid(values.themeId),
    title: values.title,
    type: values.type,
    video_url: nullableText(values.videoUrl),
  };

  let savedContentId = values.contentId;

  if (values.contentId) {
    let query = supabase
      .from("contents")
      .update(payload)
      .eq("id", values.contentId);

    if (currentUser.role !== "admin") {
      query = query.eq("created_by", currentUser.user.id);
    }

    const { data, error } = await query.select("id").maybeSingle();

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    if (!data) {
      return {
        message: "Contenu introuvable ou non autorisé.",
        status: "error",
      };
    }
  } else {
    const { data, error } = await supabase
      .from("contents")
      .insert({
        ...payload,
        created_by: currentUser.user.id,
      })
      .select("id")
      .single();

    if (error) {
      return {
        message: error.message,
        status: "error",
      };
    }

    savedContentId = data.id;
  }

  if (savedContentId) {
    await supabase.from("activity_logs").insert({
      action: values.contentId
        ? `Contenu modifié : ${values.title}`
        : `Contenu créé : ${values.title}`,
      entity_id: savedContentId,
      entity_type: "content",
      user_id: currentUser.user.id,
    });
  }

  revalidatePath("/coach");
  revalidatePath("/coach/library");

  if (savedContentId) {
    revalidatePath(`/coach/library/${savedContentId}/edit`);
  }

  redirect("/coach/library");
}
