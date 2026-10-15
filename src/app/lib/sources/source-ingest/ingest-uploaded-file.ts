import { ingestDocumentFile } from "./ingest-document-file";

export async function ingestUploadedFile(input: {
  notebookId: string;
  file: File;
  title?: string;
}) {
  return ingestDocumentFile(input);
}
