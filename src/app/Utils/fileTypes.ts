// src/utils/fileTypes.ts

const MIME_TO_EXTENSION: Record<string, string> = {
  // Documents
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "DOCX",
  "application/vnd.ms-excel": "XLS",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-powerpoint": "PPT",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "PPTX",
  "text/plain": "TXT",
  "text/csv": "CSV",

  // Images
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/gif": "GIF",
  "image/svg+xml": "SVG",
  "image/webp": "WEBP",

  // Archives
  "application/zip": "ZIP",
  "application/x-rar-compressed": "RAR",
  "application/x-7z-compressed": "7Z",
  "application/gzip": "GZ",

  // Executables
  "application/x-msdownload": "EXE",
  "application/x-executable": "EXE",
  "application/octet-stream": "BIN",

  // Audio/Video
  "video/mp4": "MP4",
  "video/x-msvideo": "AVI",
  "video/quicktime": "MOV",
  "audio/mpeg": "MP3",
  "audio/wav": "WAV",

  // Others
  "application/json": "JSON",
  "application/xml": "XML",
};

export function getFileExtension(mimeType: string | null | undefined): string {
  // Guard: if mimeType is null/undefined → return fallback
  if (!mimeType || typeof mimeType !== "string") {
    return "UNKNOWN";
  }

  // 1. Exact match
  if (MIME_TO_EXTENSION[mimeType]) {
    return MIME_TO_EXTENSION[mimeType];
  }

  // 2. Fallback by prefix (e.g. "application/" → match any application/*)
  const prefix = mimeType.split("/")[0]; // e.g. "application"
  for (const [key, ext] of Object.entries(MIME_TO_EXTENSION)) {
    if (key.startsWith(prefix + "/")) {
      return ext;
    }
  }

  // 3. Final fallback
  return "FILE";
}
