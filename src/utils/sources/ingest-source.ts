import { EmbedSourceBatchResult } from "@/types";

export function embedNextSourceBatch(
  sourceId: string,
): Promise<EmbedSourceBatchResult> {
  return Promise.resolve({
    done: true,
    embeddedChunkCount: 0,
    chunksCount: 0,
    ingestStatus: "ready",
  });
}
