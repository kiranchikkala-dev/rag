import { getFileExtension } from "@/utils/sources/source-file";
import { resolveDocumentIngestProfile } from "./documunt-profiles";

export async function ingestDocumentFile(input: {
  notebookId: string;
  file: File;
  title?: string;
}) {
  const fileExt = getFileExtension(input.file.name);
  const profile = resolveDocumentIngestProfile(input.file.name);
  const fileBuffer = Buffer.from(await input.file.arrayBuffer());
  const extracted = await profile.extract(fileBuffer, fileExt);

  return {
    sourceType: profile.sourceType,
    extracted,
  };
}
