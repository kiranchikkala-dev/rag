import { OpenAIEmbeddings } from "@langchain/openai";
import { env } from "@/env";

/**
 * Must match `documentChunks.embedding` in the Drizzle schema — a mismatch
 * fails at insert time with a pgvector dimension error.
 */
export const DOCUMENT_EMBEDDING_DIMENSIONS = 1536;

/** OpenAI caps inputs per embeddings request; 512 keeps payloads small. */
const EMBEDDING_BATCH_SIZE = 512;

let embeddingsClient: OpenAIEmbeddings | undefined;

function getEmbeddingsClient(): OpenAIEmbeddings {
  if (embeddingsClient) {
    return embeddingsClient;
  }

  if (!env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. It is required to embed document chunks.",
    );
  }

  const model = env.EMBEDDING_MODEL ?? "text-embedding-3-small";
  const supportsDimensions = model.startsWith("text-embedding-3");

  embeddingsClient = new OpenAIEmbeddings({
    apiKey: env.OPENAI_API_KEY,
    model,
    batchSize: EMBEDDING_BATCH_SIZE,
    ...(supportsDimensions
      ? { dimensions: DOCUMENT_EMBEDDING_DIMENSIONS }
      : {}),
  });

  return embeddingsClient;
}

export async function embedDocumentTexts(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const embeddings = await getEmbeddingsClient().embedDocuments(texts);

  const invalidIndex = embeddings.findIndex(
    (embedding) => embedding.length !== DOCUMENT_EMBEDDING_DIMENSIONS,
  );

  if (invalidIndex !== -1) {
    throw new Error(
      `Embedding model returned ${embeddings[invalidIndex].length} dimensions for chunk ${invalidIndex}; expected ${DOCUMENT_EMBEDDING_DIMENSIONS}. Check EMBEDDING_MODEL.`,
    );
  }

  return embeddings;
}
