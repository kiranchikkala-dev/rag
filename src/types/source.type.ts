import { z } from "zod";

export const sourceTypeSchema = z.enum(["pdf", "text", "url", "image"]);

export const sourceStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const sourceIngestStatusSchema = z.enum([
  "processing",
  "ready",
  "failed",
]);

export const sourceMetadataSchema = z
  .object({
    ingestStatus: sourceIngestStatusSchema.optional(),
    embeddedChunkCount: z.number().int().nonnegative().optional(),
    chunkCount: z.number().int().nonnegative().optional(),
    totalCharacters: z.number().int().nonnegative().optional(),
    isStoredInChunksOnly: z.boolean().optional(),
    ingestError: z.string().optional(),
    summaryStatus: z.enum(["processing", "failed"]).optional(),

    /**
     * Supabase storage path to serialized ingest chunk drafts.
     */
    ingestChunkDraftsPath: z.string().optional(),
    ingestChunkDraftCount: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;

export const notebookSourceSchema = z.object({
  id: z.string().uuid(),
  sourceType: sourceTypeSchema,
  title: z.string(),
  status: sourceStatusSchema,
  storagePath: z.string().nullable(),
  sourceUrl: z.string().nullable(),
  originalFilename: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  contentHash: z.string().nullable(),
  errorMessage: z.string().nullable(),
  metadata: sourceMetadataSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type NotebookSource = z.infer<typeof notebookSourceSchema>;

export const createNotebookSourceSchema = z.object({
  sourceType: sourceTypeSchema,
  title: z.string().trim().min(1).max(255),
  storagePath: z.string().nullable().optional(),
  sourceUrl: z.string().url().nullable().optional(),
  originalFilename: z.string().nullable().optional(),
  mimeType: z.string().nullable().optional(),
  sizeBytes: z.number().int().nonnegative().nullable().optional(),
  contentHash: z.string().nullable().optional(),
  metadata: sourceMetadataSchema.nullable().optional(),
});

export type CreateNotebookSource = z.infer<typeof createNotebookSourceSchema>;

export interface CreateSourceResult {
  source: NotebookSource;
}
export type SourceListMetadata = Pick<
  SourceMetadata,
  | "ingestStatus"
  | "ingestError"
  | "faviconUrl"
  | "thumbnailUrl"
  | "hostname"
  | "siteName"
  | "description"
  | "channelName"
  | "durationSeconds"
>;

export type NotebookSourceListItem = NotebookSource;
