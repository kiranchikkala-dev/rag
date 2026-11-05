import { Source, sources } from "@/db/schema";
import {
  EmbedSourceBatchResult,
  SourceIngestStatus,
  SourceMetadata,
} from "@/types";
import { prepareSourceText } from "./prepare-source-text";
import { db } from "@/db";

export function embedNextSourceBatch(
  sourceId: string,
): Promise<EmbedSourceBatchResult> {
  return Promise.resolve({
    done: true,
    embeddedChunkCount: 0,
    chunksCount: 0,
    ingestStatus: "ready",
  });
}

export interface CreatePendingSourceResult {
  source: Source;
}
export interface IngestSourceInput {
  notebookId: string;
  title: string;
  type: Source["sourceType"];
  extractedText: string;
  sourceUrl?: string | null;
  storagePath?: string | null;
  metadata?: SourceMetadata | null;
}
export async function createPendingSource(input: IngestSourceInput) {
  const prepared = prepareSourceText(input.extractedText);

  if (!prepared.fullText) {
    throw new Error("No text could be extracted from the source.");
  }
  const [newSource] = await db
    .insert(sources)
    .values({
      notebookId: input.notebookId,
      sourceType: input.type,
      metadata: {
        ...input.metadata,
        ingestStatus: "processing" satisfies SourceIngestStatus,
        embeddedChunkCount: 0,
        totalCharacters: prepared.totalCharacters,
        isStoredInChunksOnly: prepared.isStoredInChunksOnly,
      },
      title: input.title,
      extractedText: prepared.storedText,
      sourceUrl: input.sourceUrl ?? null,
      storagePath: input.storagePath ?? null,
    })
    .returning();
  return { source: newSource };
}
