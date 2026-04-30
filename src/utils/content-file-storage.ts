export const CONTENT_FILE_BUCKET = "coaching-content-files";
export const CONTENT_FILE_STORAGE_PREFIX = `storage://${CONTENT_FILE_BUCKET}/`;
export const MAX_CONTENT_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const CONTENT_FILE_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf";

const allowedMimeTypes = [
  "application/msword",
  "application/pdf",
  "application/rtf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/rtf",
];

const allowedExtensions = [
  "doc",
  "docx",
  "pdf",
  "ppt",
  "pptx",
  "rtf",
  "txt",
  "xls",
  "xlsx",
];

export const ALLOWED_CONTENT_FILE_MIME_TYPES = allowedMimeTypes;

export function formatContentFileSize(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)} Mo`;
}

export function getContentFileValidationError(file: {
  name: string;
  size: number;
  type?: string;
}) {
  if (!file.size) {
    return "Le document est vide.";
  }

  if (file.size > MAX_CONTENT_FILE_SIZE_BYTES) {
    return `Le document doit faire moins de ${formatContentFileSize(
      MAX_CONTENT_FILE_SIZE_BYTES,
    )}.`;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasAllowedExtension = allowedExtensions.includes(extension);
  const hasAllowedMimeType = file.type
    ? allowedMimeTypes.includes(file.type)
    : false;

  if (!hasAllowedExtension && !hasAllowedMimeType) {
    return "Format non pris en charge. Ajoutez un PDF, Word, PowerPoint, Excel, TXT ou RTF.";
  }

  return null;
}

export function sanitizeContentFileName(fileName: string) {
  const sanitized = fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

  return sanitized || "document";
}

export function createContentFileObjectPath(userId: string, fileName: string) {
  return `${userId}/${crypto.randomUUID()}-${sanitizeContentFileName(fileName)}`;
}

export function createContentStorageReference(path: string) {
  return `${CONTENT_FILE_STORAGE_PREFIX}${path.replace(/^\/+/, "")}`;
}

export function parseContentStorageReference(value: string | null | undefined) {
  if (!value?.startsWith(CONTENT_FILE_STORAGE_PREFIX)) {
    return null;
  }

  const path = value.slice(CONTENT_FILE_STORAGE_PREFIX.length).replace(/^\/+/, "");

  return path
    ? {
        bucket: CONTENT_FILE_BUCKET,
        path,
      }
    : null;
}

export function contentFileDownloadHref(contentId: string) {
  return `/content-files/${contentId}`;
}
