import { db } from "@/db";
import { env } from "@/env";
import { notebooks } from "@/db/schema";
import { embedDocumentTexts } from "@/utils/embeddings/document-embeddings";
import { apiError, apiSuccess } from "@/utils/api-route";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { retrieveChunks } from "@/app/lib/chat/retrieve-chunks";
import { rerankChunks } from "@/app/lib/chat/rerank-chunks";
import {
  listNotebookChatMessages,
  saveNotebookChatMessage,
} from "@/app/lib/chat/chat-messages.service";

const MAX_CONTEXT_CHUNKS = 5;
const MAX_CONTEXT_CHARACTERS = 12_000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notebookId } = await params;
    if (!notebookId?.trim()) {
      return apiError(
        new Error("Validation failed: Invalid notebook ID"),
        "Invalid notebook ID",
      );
    }

    const notebook = await db
      .select({ id: notebooks.id })
      .from(notebooks)
      .where(eq(notebooks.id, notebookId))
      .limit(1);

    if (notebook.length === 0) {
      return apiError(new Error("Notebook not found"), "Notebook not found", 404);
    }

    const messages = await listNotebookChatMessages(notebookId);
    return apiSuccess(messages);
  } catch (error) {
    console.error("Chat history error:", error);
    return apiError(error, "Internal server error");
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: notebookId } = await params;

    if (!notebookId?.trim()) {
      return apiError(
        new Error("Validation failed: Invalid notebook ID"),
        "Invalid notebook ID",
      );
    }

    let body: { query?: unknown };

    try {
      body = await request.json();
    } catch {
      return apiError(
        new Error("Validation failed: Invalid JSON body"),
        "Invalid JSON body",
      );
    }

    if (typeof body.query !== "string" || !body.query.trim()) {
      return apiError(
        new Error("Validation failed: Invalid query"),
        "Invalid query",
      );
    }

    const query = body.query.trim();

    if (query.length > 200) {
      return apiError(
        new Error("Validation failed: Query must not exceed 200 characters"),
        "Query must not exceed 200 characters",
      );
    }

    const notebook = await db
      .select()
      .from(notebooks)
      .where(eq(notebooks.id, notebookId))
      .limit(1);

    if (notebook.length === 0) {
      return apiError(
        new Error("Notebook not found"),
        "Notebook not found",
        404,
      );
    }

    const [embedding] = await embedDocumentTexts([query]);

    const candidates = await retrieveChunks({
      notebookId,
      embedding,
      limit: 20,
    });

    const rankedChunks = rerankChunks(query, candidates);
    const contextChunks = selectContextChunks(rankedChunks);

    await saveNotebookChatMessage({
      notebookId,
      role: "user",
      content: query,
    });

    if (contextChunks.length === 0) {
      const answer = "I couldn't find relevant passages in this notebook.";
      await saveNotebookChatMessage({
        notebookId,
        role: "assistant",
        content: answer,
      });
      return new Response(answer, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    const model = createChatModel();
    const messages = [
      new SystemMessage(
        `You answer questions using only the notebook passages provided below. If the passages do not contain the answer, say so. Cite factual claims with the passage citation label, such as [1]. Do not invent citations.\n\nNotebook passages:\n${formatContext(contextChunks)}`,
      ),
      new HumanMessage(query),
    ];
    const modelStream = await model.stream(messages);
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          let answer = "";
          for await (const chunk of modelStream) {
            if (chunk.text) {
              answer += chunk.text;
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          await saveNotebookChatMessage({
            notebookId,
            role: "assistant",
            content: answer,
            citations: contextChunks.map((chunk, index) => ({
              label: String(index + 1),
              source: `${chunk.sourceTitle} (source ${chunk.sourceId}, chunk ${chunk.chunkIndex})`,
            })),
          });
          controller.enqueue(encoder.encode(`\n\n${formatCitations(contextChunks)}`));
          controller.close();
        } catch (error) {
          console.error("Chat response stream error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("RAG search error:", error);
    return apiError(error, "Internal server error");
  }
}

function createChatModel(): ChatOpenAI {
  if (env.OPENROUTER_API_KEY) {
    return new ChatOpenAI({
      model: "openai/gpt-4o-mini",
      apiKey: env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      streaming: true,
    });
  }

  if (env.OPENAI_API_KEY) {
    return new ChatOpenAI({
      model: "gpt-4o-mini",
      apiKey: env.OPENAI_API_KEY,
      streaming: true,
    });
  }

  throw new Error("Set OPENROUTER_API_KEY or OPENAI_API_KEY to enable chat.");
}

function selectContextChunks<T extends { content: string }>(
  chunks: T[],
): T[] {
  const selected: T[] = [];
  let characterCount = 0;

  for (const chunk of chunks) {
    if (selected.length >= MAX_CONTEXT_CHUNKS) break;

    const remainingCharacters = MAX_CONTEXT_CHARACTERS - characterCount;
    if (remainingCharacters <= 0) break;

    const content = chunk.content.slice(0, remainingCharacters);
    selected.push({ ...chunk, content });
    characterCount += content.length;
  }

  return selected;
}

function formatContext(
  chunks: Array<{
    content: string;
    sourceTitle: string;
    sourceId: string;
    chunkIndex: number;
  }>,
): string {
  return chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] Source: ${chunk.sourceTitle} (source ${chunk.sourceId}, chunk ${chunk.chunkIndex})\n${chunk.content}`,
    )
    .join("\n\n");
}

function formatCitations(
  chunks: Array<{
    sourceTitle: string;
    sourceId: string;
    chunkIndex: number;
  }>,
): string {
  return `Sources:\n${chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.sourceTitle} (source ${chunk.sourceId}, chunk ${chunk.chunkIndex})`,
    )
    .join("\n")}`;
}
