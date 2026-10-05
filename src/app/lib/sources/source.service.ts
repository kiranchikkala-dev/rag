import {
  NotebookSourceListItem,
  SourceListMetadata,
} from "@/types/source.type";
import { db } from "@/db";
import { sources } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

const sourceSidebarMetadata = sql<SourceListMetadata | null>`
  CASE
    WHEN ${sources.metadata} IS NULL THEN NULL
    ELSE jsonb_strip_nulls(
      jsonb_build_object(
        'ingestStatus', ${sources.metadata} -> 'ingestStatus',
        'ingestError', ${sources.metadata} -> 'ingestError',
        'faviconUrl', ${sources.metadata} -> 'faviconUrl',
        'thumbnailUrl', ${sources.metadata} -> 'thumbnailUrl',
        'hostname', ${sources.metadata} -> 'hostname',
        'siteName', ${sources.metadata} -> 'siteName',
        'description', ${sources.metadata} -> 'description',
        'channelName', ${sources.metadata} -> 'channelName',
        'durationSeconds', ${sources.metadata} -> 'durationSeconds'
      )
    )
  END
`.as("metadata");

const sourceSidebarListSelect = {
  id: sources.id,
  title: sources.title,
  type: sources.sourceType,
  status: sources.status,
  createdAt: sources.createdAt,
  metadata: sourceSidebarMetadata,
};

export function toNotebookSourceListItem(source: {
  id: string;
  title: string;
  type: any;
  metadata: SourceListMetadata | null;
  isSelected: boolean;
  createdAt: Date | string;
}) {
  const metadata = source.metadata;

  return {
    id: source.id,
    title: source.title,
    type: source.type,
    metadata,
    isSelected: source.isSelected,
    createdAt:
      source.createdAt instanceof Date
        ? source.createdAt.toISOString()
        : source.createdAt,
    // ingestStatus: getSourceIngestStatus(metadata),
  };
}
export async function listNotebookSources(
  notebookId: string,
): Promise<NotebookSourceListItem[]> {
  //   await assertNotebookOwner(notebookId, userId);

  const notebookSources = await db
    .select(sourceSidebarListSelect)
    .from(sources)
    .where(eq(sources.notebookId, notebookId))
    .orderBy(sources.createdAt);
  console.log("🚀 ~ listNotebookSources ~ notebookSources:", notebookSources);

  return notebookSources.map((source) => toNotebookSourceListItem(source));
}
