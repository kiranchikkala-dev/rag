import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notebookChatMessages } from "@/db/schema";

export type ChatCitation = {
  label: string;
  source: string;
};

export type NotebookChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: ChatCitation[];
  createdAt: Date;
};

export async function listNotebookChatMessages(
  notebookId: string,
): Promise<NotebookChatMessage[]> {
  const rows = await db
    .select({
      id: notebookChatMessages.id,
      role: notebookChatMessages.role,
      parts: notebookChatMessages.parts,
      metadata: notebookChatMessages.metadata,
      createdAt: notebookChatMessages.createdAt,
    })
    .from(notebookChatMessages)
    .where(eq(notebookChatMessages.notebookId, notebookId))
    .orderBy(asc(notebookChatMessages.createdAt));

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    content: readText(row.parts),
    citations: readCitations(row.metadata),
    createdAt: row.createdAt,
  }));
}

export async function saveNotebookChatMessage({
  notebookId,
  role,
  content,
  citations,
}: {
  notebookId: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}): Promise<void> {
  await db.insert(notebookChatMessages).values({
    notebookId,
    role,
    parts: [{ type: "text", text: content }],
    metadata: citations?.length ? { citations } : null,
  });
}

function readText(parts: unknown): string {
  if (!Array.isArray(parts)) return "";

  return parts
    .map((part) => {
      if (typeof part !== "object" || part === null || !("text" in part)) {
        return "";
      }
      return typeof part.text === "string" ? part.text : "";
    })
    .join("");
}

function readCitations(metadata: unknown): ChatCitation[] {
  if (typeof metadata !== "object" || metadata === null || !("citations" in metadata)) {
    return [];
  }

  const citations = metadata.citations;
  if (!Array.isArray(citations)) return [];

  return citations.filter(
    (citation): citation is ChatCitation =>
      typeof citation === "object" &&
      citation !== null &&
      "label" in citation &&
      typeof citation.label === "string" &&
      "source" in citation &&
      typeof citation.source === "string",
  );
}
