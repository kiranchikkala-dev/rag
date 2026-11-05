import { createClient } from "../../supabase/client";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";
const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLS_MIME = "application/vnd.ms-excel";
const DOCUMENT_CONTENT_TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  doc: DOC_MIME,
  docx: DOCX_MIME,
  json: "application/json",
  html: "text/html",
  htm: "text/html",
  xls: XLS_MIME,
  xlsx: XLSX_MIME,
  csv: "text/csv",
};

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

export function resolveDocumentUploadContentType(
  fileName: string,
  mimeType = "",
): string | undefined {
  const extension = getFileExtension(fileName);
  if (DOCUMENT_CONTENT_TYPE_BY_EXT[extension]) {
    return DOCUMENT_CONTENT_TYPE_BY_EXT[extension];
  }

  if (mimeType) {
    return mimeType;
  }

  return undefined;
}
export async function uploadSourceBuffer(input: {
  // userId: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType?: string;
}): Promise<{ storagePath: string; publicUrl: string }> {
  const fileExt = getFileExtension(input.fileName);
  const randomId = Math.random().toString(36).substring(2, 9);
  const storagePath = `${Date.now()}-${randomId}.${fileExt}`;
  const supabase = await createClient();
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("sources")
    .upload(storagePath, input.fileBuffer, {
      cacheControl: "3600",
      upsert: false,
      contentType: resolveDocumentUploadContentType(
        input.fileName,
        input.mimeType,
      ),
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);

    throw new Error(`Storage upload failed: ${uploadError.message}`);
  }

  if (!uploadData) {
    throw new Error("Storage upload returned no data and no error.");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("sources").getPublicUrl(uploadData.path);

  return { storagePath, publicUrl };
}
