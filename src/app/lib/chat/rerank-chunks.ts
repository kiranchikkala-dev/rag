import type { RetrievedChunk } from "@/app/lib/chat/retrieve-chunks";

export type RerankedChunk = RetrievedChunk & { rerankScore: number };

export function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
): RerankedChunk[] {
  const queryTerms = new Set(tokenize(query));
  const seenContent = new Set<string>();
  const uniqueChunks = chunks.filter((chunk) => {
    const normalizedContent = chunk.content
      .normalize("NFKC")
      .toLocaleLowerCase()
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedContent || seenContent.has(normalizedContent)) {
      return false;
    }

    seenContent.add(normalizedContent);
    return true;
  });

  return uniqueChunks
    .map((chunk) => {
      const contentTerms = new Set(tokenize(chunk.content));
      const matchedTerms = [...queryTerms].filter((term) =>
        contentTerms.has(term),
      ).length;
      const lexicalScore =
        queryTerms.size === 0 ? 0 : matchedTerms / queryTerms.size;
      const normalizedVectorScore = Math.max(
        0,
        Math.min(1, (chunk.similarity + 1) / 2),
      );
      const phraseBoost =
        query.trim().length > 0 &&
        chunk.content.toLocaleLowerCase().includes(query.toLocaleLowerCase())
          ? 0.05
          : 0;

      return {
        ...chunk,
        rerankScore: Math.min(
          1,
          normalizedVectorScore * 0.75 + lexicalScore * 0.25 + phraseBoost,
        ),
      };
    })
    .sort((a, b) => b.rerankScore - a.rerankScore);
}

function tokenize(text: string): string[] {
  return text.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}
