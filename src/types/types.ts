import { Source } from "@/db/schema";
import { SourceMetadata } from "./source.type";

export interface DocumentIngestUnit {
  kind: "text" | "figure";
  page: number;
  content: string;
  imageBuffer?: Buffer;
  imageContentType?: string;
  imageUrl?: string;
}
export interface DocumentExtractResult {
  fullText: string;
  units: DocumentIngestUnit[];
  title?: string;
}
export interface DocumentIngestProfile {
  id: string;
  extensions: readonly string[];
  sourceType: any;
  structured: boolean;
  extract: (
    buffer: Buffer,
    extension: string,
  ) => Promise<DocumentExtractResult>;
}
export interface SourceIngestCommitInput {
  notebookId: string;
  title: string;
  type: Source["sourceType"];
  extractedText: string;
  sourceUrl?: string | null;
  storagePath?: string | null;
  metadata?: SourceMetadata;
  structuredUnits?: DocumentIngestUnit[];
}

export function resolveSourceTitle(
  explicitTitle: string | undefined,
  fallback: string,
): string {
  const trimmed = explicitTitle?.trim();
  return trimmed || fallback;
}
