import { getFileExtension } from "@/utils/sources/source-file";
import { resolveDocumentIngestProfile } from "./documunt-profiles";
import { commitSourceIngest } from "./commit";
import { resolveSourceTitle } from "@/types/types";
import { uploadSourceBuffer } from "./upload-source-buffer";

export async function ingestDocumentFile(input: {
  notebookId: string;
  file: File;
  title?: string;
}) {
  const fileExt = getFileExtension(input.file.name);
  const profile = resolveDocumentIngestProfile(input.file.name);
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  let extracted;

  try {
    extracted = await profile.extract(fileBuffer, fileExt);
  } catch (error) {
    throw new Error(
      // error?.me,
      "Could not read this file. It may be corrupted or unsupported.",
    );
  }

  const { storagePath, publicUrl } = await uploadSourceBuffer({
    // userId: input.user.id,
    fileBuffer,
    fileName: input.file.name,
    mimeType: input.file.type,
  });

  return commitSourceIngest({
    notebookId: input.notebookId,
    title: resolveSourceTitle(input.title, extracted.title ?? input.file.name),
    type: profile.sourceType,
    extractedText: extracted.fullText,
    sourceUrl: publicUrl,
    storagePath,
    structuredUnits: profile.structured ? extracted.units : undefined,
  });
}
