import { db } from "@/db";
import { sources } from "@/db/schema";
import { SourceIngestCommitInput } from "@/types/types";
import type { SourceMetadata } from "@/types";
import { createPendingSource } from "@/utils/sources/ingest-source";
import type { CreatePendingSourceResult } from "@/utils/sources/ingest-source";
import { uploadIngestFigureImages } from "@/utils/document/pdf-document";
import { eq } from "drizzle-orm";
import { createClient } from "../../supabase/client";
import { buildChunkDraftsFromUnits } from "../../chunks/ingest-drafts";

export async function commitSourceIngest(
  input: SourceIngestCommitInput,
): Promise<CreatePendingSourceResult> {
  const result = await createPendingSource({
    notebookId: input.notebookId,
    title: input.title,
    type: input.type,
    extractedText: input.extractedText,
    sourceUrl: input.sourceUrl ?? null,
    storagePath: input.storagePath ?? null,
    metadata: input.metadata,
  });

  const supabase = await createClient();
  const unitsWithUrls = await uploadIngestFigureImages(
    supabase,
    // userId,
    result.source.id,
    input.structuredUnits ?? [],
  );

  const chunks = await buildChunkDraftsFromUnits(
    unitsWithUrls,
    result.source.id,
  );

  if (chunks.length === 0) {
    return result;
  }

  const [updatedSource] = await db
    .update(sources)
    .set({
      status: "completed",
      metadata: {
        ...(result.source.metadata as SourceMetadata | null),
        ingestStatus: "ready",
        chunkCount: chunks.length,
        embeddedChunkCount: chunks.length,
      },
      updatedAt: new Date(),
    })
    .where(eq(sources.id, result.source.id))
    .returning();

  return { source: updatedSource };
}
