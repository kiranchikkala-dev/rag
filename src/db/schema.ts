import { relations } from "drizzle-orm";
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
  extractedText: text("extracted_text"),
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
export const senderEnum = pgEnum("message_sender", ["user", "assistant"]);

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

export const notebookChatMessages = pgTable("notebook_chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  notebookId: uuid("notebook_id")
    .references(() => notebooks.id, {
      onDelete: "cascade",
    })
    .notNull(),
  role: senderEnum("role").notNull(),
  parts: jsonb("parts").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notebookChatMessageRelations = relations(
  notebookChatMessages,
  ({ one, many }) => ({
    notebook: one(notebooks, {
      fields: [notebookChatMessages.notebookId],
      references: [notebooks.id],
    }),
  }),
);
export const sourceRelations = relations(sources, ({ one, many }) => ({
  notebooks: one(notebooks, {
    fields: [sources.notebookId],
    references: [notebooks.id],
  }),
  chunks: many(documentChunks),
}));
export const documentChunkRelations = relations(documentChunks, ({ one }) => ({
  sources: one(sources, {
    fields: [documentChunks.sourceId],
    references: [sources.id],
  }),
}));

export type Notebook = typeof notebooks.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type DocumentChunk = typeof documentChunks.$inferSelect;
