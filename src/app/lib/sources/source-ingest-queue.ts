import { sourceClient } from "@/tanstack/client/source.client";
import { sourceQueryKeys } from "@/tanstack/queries/source.query-keys";
import { NotebookSourceIngestRef } from "@/types";
import type { QueryClient } from "@tanstack/react-query";

interface QueueItem {
  notebookId: string;
  sourceId: string;
}
class SourceIngestQueue {
  private queue: QueueItem[] = [];
  private activeSourceIds = new Set<string>();
  private isRunning = false;

  enqueue(notebookId: string, sourceIds: string[], queryClient: QueryClient) {
    for (const sourceId of sourceIds) {
      if (this.activeSourceIds.has(sourceId)) {
        continue;
      }
      this.activeSourceIds.add(sourceId);
      this.queue.push({ notebookId, sourceId });
    }
    void this.process(queryClient);
  }
  private async process(queryClient: QueryClient) {
    if (this.isRunning) {
      return;
    }
    this.isRunning = true;
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) {
        continue;
      }
      try {
        let done = false;
        while (!done) {
          const response = await sourceClient.embedSourceBatch(item.sourceId);
          done = response?.data?.done ?? true;
        }
      } catch (error) {
        console.error(
          `[source-ingest] Failed to embed source ${item.sourceId}:`,
          error,
        );
      } finally {
        this.activeSourceIds.delete(item.sourceId);
      }
    }
    this.isRunning = false;
  }
}
const sourceIngestQueue = new SourceIngestQueue();

function enqueueSourceIngest(
  notebookId: string,
  sourceIds: string[],
  queryClient: QueryClient,
) {
  sourceIngestQueue.enqueue(notebookId, sourceIds, queryClient);
}
function handleCreatedSources(
  notebookId: string,
  createdSources: NotebookSourceIngestRef[],
  queryClient: QueryClient,
) {
  queryClient.invalidateQueries({
    queryKey: sourceQueryKeys.notebookSources(notebookId),
  });
  const processingIds = createdSources
    .filter((source) => source.metadata?.ingestStatus === "processing")
    .map((source) => source.id);

  enqueueSourceIngest(notebookId, processingIds, queryClient);
}
