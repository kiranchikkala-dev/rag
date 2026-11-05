import { and, cosineDistance, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { documentChunks, sources } from "@/db/schema";

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

export type RetrievedChunk = {
  id: string;
  content: string;
  chunkIndex: number;
  metadata: unknown;
  sourceId: string;
  sourceTitle: string;
  similarity: number;
};

/** Retrieve the most similar chunks from completed sources in one notebook. */
export async function retrieveChunks({
  notebookId,
  embedding,
  limit = DEFAULT_LIMIT,
  minimumSimilarity = 0,
}: {
  notebookId: string;
  embedding: number[];
  limit?: number;
  minimumSimilarity?: number;
}): Promise<RetrievedChunk[]> {
  if (!notebookId.trim()) {
    throw new Error("A notebook ID is required to retrieve chunks.");
  }
  if (
    embedding.length !== 1536 ||
    embedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("The query embedding must contain 1536 finite values.");
  }
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("The retrieval limit must be a positive integer.");
  }
  if (
    !Number.isFinite(minimumSimilarity) ||
    minimumSimilarity < -1 ||
    minimumSimilarity > 1
  ) {
    throw new Error("Minimum similarity must be between -1 and 1.");
  }

  const boundedLimit = Math.min(limit, MAX_LIMIT);
  const distance = cosineDistance(documentChunks.embedding, embedding);
  const similarity = sql<number>`1 - (${distance})`;

  return db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      chunkIndex: documentChunks.chunkIndex,
      metadata: documentChunks.metadata,
      sourceId: sources.id,
      sourceTitle: sources.title,
      similarity,
    })
    .from(documentChunks)
    .innerJoin(sources, eq(documentChunks.sourceId, sources.id))
    .where(
      and(
        eq(sources.notebookId, notebookId),
        eq(sources.status, "completed"),
        gt(similarity, minimumSimilarity),
      ),
    )
    .orderBy(desc(similarity))
    .limit(boundedLimit);
}
