"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  CONTENT_FILE_BUCKET,
  createContentFileObjectPath,
  createContentStorageReference,
  getContentFileValidationError,
  parseContentStorageReference,
} from "@/utils/content-file-storage";

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
  removeDocumentFile: z.boolean(),
  status: z.enum(["draft", "published"]),
  subthemeId: optionalUuid,
  tags: z.string().trim().optional(),
  themeId: optionalUuid,
  title: z.string().trim().min(2, "Le titre doit contenir au moins 2 caractères."),
  type: z.enum(["text", "video", "external_link", "document", "quiz"]),
  uploadedFileUrl: z.string().trim().optional(),
  videoUrl: z.string().trim().optional(),
});

const uploadRequestSchema = z.object({
  contentId: optionalUuid,
  fileName: z.string().trim().min(1, "Nom de fichier manquant."),
  fileSize: z.coerce.number().int().positive("Taille de fichier invalide."),
  fileType: z.string().trim().optional(),
});

export type SaveContentState = {
  message: string;
  status: "error" | "idle";
};

export type ContentFileUploadState = {
  message: string;
  path?: string;
  status: "error" | "success";
  storageRef?: string;
  token?: string;
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

function storageSetupErrorMessage(message: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("bucket") || lowerMessage.includes("not found")) {
    return "Bucket Storage introuvable. Exécutez supabase/enable-content-file-storage.sql puis réessayez.";
  }

  return message;
}

function getUploadedStorageReference(value: string | undefined, userId: string) {
  const parsed = parseContentStorageReference(value);

  if (!value) {
    return {
      error: null,
      fileUrl: null,
    };
  }

  if (!parsed || !parsed.path.startsWith(`${userId}/`)) {
    return {
      error: "Document uploadé invalide.",
      fileUrl: null,
    };
  }

  return {
    error: null,
    fileUrl: createContentStorageReference(parsed.path),
  };
}

function getFormFile(formData: FormData) {
  const file = formData.get("documentFile");

  return file instanceof File && file.size > 0 ? file : null;
}

async function uploadContentFile(file: File, userId: string) {
  const validationError = getContentFileValidationError({
    name: file.name,
    size: file.size,
    type: file.type,
  });

  if (validationError) {
    return {
      error: validationError,
      fileUrl: null,
    };
  }

  const path = createContentFileObjectPath(userId, file.name);
  const adminSupabase = createServiceSupabaseClient();
  const { error } = await adminSupabase.storage
    .from(CONTENT_FILE_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return {
      error: storageSetupErrorMessage(error.message),
      fileUrl: null,
    };
  }

  return {
    error: null,
    fileUrl: createContentStorageReference(path),
  };
}

async function removeContentFile(fileUrl: string | null) {
  const parsed = parseContentStorageReference(fileUrl);

  if (!parsed) {
    return;
  }

  const adminSupabase = createServiceSupabaseClient();
  await adminSupabase.storage.from(parsed.bucket).remove([parsed.path]);
}

async function resolveContentFileUrl({
  currentFileUrl,
  formData,
  removeDocumentFile,
  uploadedFileUrl,
  userId,
}: {
  currentFileUrl: string | null;
  formData: FormData;
  removeDocumentFile: boolean;
  uploadedFileUrl?: string;
  userId: string;
}) {
  const uploaded = getUploadedStorageReference(uploadedFileUrl, userId);

  if (uploaded.error) {
    return {
      error: uploaded.error,
      fileUrl: null,
      shouldRemoveCurrentFile: false,
    };
  }

  if (uploaded.fileUrl) {
    return {
      error: null,
      fileUrl: uploaded.fileUrl,
      shouldRemoveCurrentFile: uploaded.fileUrl !== currentFileUrl,
    };
  }

  const file = getFormFile(formData);

  if (file) {
    const uploadResult = await uploadContentFile(file, userId);

    return {
      error: uploadResult.error,
      fileUrl: uploadResult.fileUrl,
      shouldRemoveCurrentFile: Boolean(
        uploadResult.fileUrl && uploadResult.fileUrl !== currentFileUrl,
      ),
    };
  }

  if (removeDocumentFile) {
    return {
      error: null,
      fileUrl: null,
      shouldRemoveCurrentFile: Boolean(currentFileUrl),
    };
  }

  return {
    error: null,
    fileUrl: currentFileUrl,
    shouldRemoveCurrentFile: false,
  };
}

export async function createContentFileUploadAction(
  formData: FormData,
): Promise<ContentFileUploadState> {
  const currentUser = await requireRole(["admin", "coach"]);
  const parsed = uploadRequestSchema.safeParse({
    contentId: formData.get("contentId"),
    fileName: formData.get("fileName"),
    fileSize: formData.get("fileSize"),
    fileType: formData.get("fileType"),
  });

  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Le document sélectionné est invalide.",
      status: "error",
    };
  }

  const validationError = getContentFileValidationError({
    name: parsed.data.fileName,
    size: parsed.data.fileSize,
    type: parsed.data.fileType,
  });

  if (validationError) {
    return {
      message: validationError,
      status: "error",
    };
  }

  const path = createContentFileObjectPath(
    currentUser.user.id,
    parsed.data.fileName,
  );
  const adminSupabase = createServiceSupabaseClient();
  const { data, error } = await adminSupabase.storage
    .from(CONTENT_FILE_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    return {
      message: storageSetupErrorMessage(
        error?.message ?? "Impossible de préparer l'upload.",
      ),
      status: "error",
    };
  }

  return {
    message: "Upload prêt.",
    path: data.path,
    status: "success",
    storageRef: createContentStorageReference(data.path),
    token: data.token,
  };
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
    removeDocumentFile: formData.get("removeDocumentFile") === "on",
    status: formData.get("status"),
    subthemeId: formData.get("subthemeId"),
    tags: formData.get("tags"),
    themeId: formData.get("themeId"),
    title: formData.get("title"),
    type: formData.get("type"),
    uploadedFileUrl: formData.get("uploadedFileUrl"),
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
  let savedContentId = values.contentId;
  let currentFileUrl: string | null = null;

  if (values.contentId) {
    let currentQuery = supabase
      .from("contents")
      .select("id,file_url")
      .eq("id", values.contentId);

    if (currentUser.role !== "admin") {
      currentQuery = currentQuery.eq("created_by", currentUser.user.id);
    }

    const { data, error } = await currentQuery.maybeSingle();

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

    currentFileUrl = data.file_url;
  }

  const fileResult = await resolveContentFileUrl({
    currentFileUrl,
    formData,
    removeDocumentFile: values.removeDocumentFile,
    uploadedFileUrl: values.uploadedFileUrl,
    userId: currentUser.user.id,
  });

  if (fileResult.error) {
    return {
      message: fileResult.error,
      status: "error",
    };
  }

  const payload = {
    body: nullableText(values.body),
    description: nullableText(values.description),
    external_url: nullableText(values.externalUrl),
    file_url: fileResult.fileUrl,
    status: values.status,
    subtheme_id: nullableUuid(values.subthemeId),
    tags: parseTags(values.tags),
    theme_id: nullableUuid(values.themeId),
    title: values.title,
    type: values.type,
    video_url: nullableText(values.videoUrl),
  };

  if (values.contentId) {
    const { error } = await supabase
      .from("contents")
      .update(payload)
      .eq("id", values.contentId);

    if (error) {
      return {
        message: error.message,
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

  if (fileResult.shouldRemoveCurrentFile) {
    await removeContentFile(currentFileUrl);
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
