import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

export const notebooks = pgTable("notebooks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").default("Untitled notebook").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
});

export const sourceTypeEnum = pgEnum("source_type", [
  "pdf",
  "text",
  "url",
  "image",
]);

export const sourceStatusEnum = pgEnum("source_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const sources = pgTable("sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  notebookId: uuid("notebook_id")
    .notNull()
    .references(() => notebooks.id, { onDelete: "cascade" }),

  sourceType: sourceTypeEnum("source_type").notNull(),
  title: text("title").notNull(),
  status: sourceStatusEnum("status").notNull().default("pending"),
  storagePath: text("storage_path"),
  sourceUrl: text("source_url"),
  originalFilename: text("original_filename"),
  mimeType: text("mime_type"),
  sizeBytes: integer("size_bytes"),
  contentHash: text("content_hash"),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata"), // e.g., token count, file size, YouTube length
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
});

export const documentChunks = pgTable("document_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceId: uuid("source_id")
    .references(() => sources.id, { onDelete: "cascade" })
    .notNull(),
  chunkIndex: integer("chunk_index").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // e.g., token count, chunk size
  embedding: vector("embedding", { dimensions: 1536 }).notNull(),
});
export type Notebook = typeof notebooks.$inferSelect;
export type Source = typeof sources.$inferSelect;
