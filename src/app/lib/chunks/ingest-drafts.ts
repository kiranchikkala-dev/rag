import { db } from "@/db";
import { documentChunks } from "@/db/schema";
import type { DocumentChunk } from "@/db/schema";
import { DocumentIngestUnit } from "@/types/types";
import { embedDocumentTexts } from "@/utils/embeddings/document-embeddings";

/** Rows per INSERT — keeps statements well under Postgres' parameter limit. */
const CHUNK_INSERT_BATCH_SIZE = 100;

export interface DocumentChunkMetadata {
  kind: DocumentIngestUnit["kind"];
  page: number;
  characterCount: number;
  imageUrl?: string;
}

export interface DocumentChunkDraft {
  chunkIndex: number;
  content: string;
  metadata: DocumentChunkMetadata;
}

/**
 * Turns extracted units into insertable drafts. Pure: no network or DB access,
 * so the ordering/indexing rules can be tested without an embedding provider.
 *
 * `chunkIndex` is assigned after filtering empty content, so it is contiguous
 * and matches the order units were extracted in (text chunks and figures
 * interleaved per page).
 */
export function toChunkDraftsFromUnits(
  units: DocumentIngestUnit[],
): DocumentChunkDraft[] {
  const drafts: DocumentChunkDraft[] = [];

  for (const unit of units) {
    const content = unit.content.trim();

    if (!content) {
      continue;
    }

    drafts.push({
      chunkIndex: drafts.length,
      content,
      metadata: {
        kind: unit.kind,
        page: unit.page,
        characterCount: content.length,
        ...(unit.imageUrl ? { imageUrl: unit.imageUrl } : {}),
      },
    });
  }

  return drafts;
}

/**
 * Embeds every unit and persists the result as `document_chunks` rows for
 * `sourceId`, returning the inserted rows to the caller.
 *
 * Embeddings are generated for all drafts before any insert happens, so an
 * embedding failure leaves the source without partial chunks.
 */
export async function buildChunkDraftsFromUnits(
  units: DocumentIngestUnit[],
  sourceId: string,
): Promise<DocumentChunk[]> {
  const drafts = toChunkDraftsFromUnits(units);

  if (drafts.length === 0) {
    return [];
  }

  const embeddings = await embedDocumentTexts(
    drafts.map((draft) => draft.content),
  );

  const rows = drafts.map((draft, index) => {
    const embedding = embeddings[index];

    if (!embedding) {
      throw new Error(`Missing embedding for chunk ${draft.chunkIndex}.`);
    }

    return {
      sourceId,
      chunkIndex: draft.chunkIndex,
      content: draft.content,
      metadata: draft.metadata,
      embedding,
    };
  });

  return db.transaction(async (tx) => {
    const created: DocumentChunk[] = [];

    for (let start = 0; start < rows.length; start += CHUNK_INSERT_BATCH_SIZE) {
      const inserted = await tx
        .insert(documentChunks)
        .values(rows.slice(start, start + CHUNK_INSERT_BATCH_SIZE))
        .returning();

      created.push(...inserted);
    }

    return created;
  });
}
