"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  FileText,
  ImageIcon,
  LibraryBig,
  Link2,
  Plus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotebookSources } from "@/tanstack/queries/source.query";
import type {
  NotebookSourceListItem,
  SourceIngestStatus,
} from "@/types/source.type";
import { cn } from "@/app/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Skeleton } from "../ui/skeleton";

const SOURCE_TYPES: Record<
  NotebookSourceListItem["type"],
  { label: string; icon: LucideIcon }
> = {
  pdf: { label: "PDF", icon: FileText },
  text: { label: "Text", icon: FileText },
  url: { label: "Link", icon: Link2 },
  image: { label: "Image", icon: ImageIcon },
};

const INGEST_STATUS: Record<
  "processing" | "ready" | "failed",
  { label: string; dotClassName: string }
> = {
  processing: {
    label: "Processing",
    dotClassName: "bg-amber-500 animate-pulse",
  },
  ready: { label: "Ready", dotClassName: "bg-emerald-500" },
  failed: { label: "Failed", dotClassName: "bg-destructive" },
};

function SourceStatus({ status }: { status: SourceIngestStatus }) {
  const config = INGEST_STATUS[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1",
        status === "failed" && "text-destructive",
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dotClassName)} />
      {config.label}
    </span>
  );
}

function SourceRow({
  source,
  isActive,
  onSelect,
}: {
  source: NotebookSourceListItem;
  isActive: boolean;
  onSelect: () => void;
}) {
  const type = SOURCE_TYPES[source.type] ?? SOURCE_TYPES.text;
  const TypeIcon = type.icon;
  const ingestStatus = source.metadata?.ingestStatus;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={source.title}
        isActive={isActive}
        onClick={onSelect}
        className="h-auto items-start gap-2.5 py-2 transition-colors"
      >
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-border/60 group-data-[collapsible=icon]:mt-0 group-data-[collapsible=icon]:size-4 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:ring-0">
          <TypeIcon className="size-3.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 group-data-[collapsible=icon]:hidden">
          <span className="truncate text-[13px] leading-5 font-medium">
            {source.title}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] leading-4 text-muted-foreground">
            <span>{type.label}</span>
            {ingestStatus ? (
              <>
                <span aria-hidden="true">·</span>
                <SourceStatus status={ingestStatus} />
              </>
            ) : null}
          </span>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SourcesSkeleton() {
  return (
    <>
      {[0, 1, 2].map((key) => (
        <SidebarMenuItem
          key={key}
          className="group-data-[collapsible=icon]:hidden"
        >
          <div className="flex items-center gap-2.5 px-2 py-2">
            <Skeleton className="size-7 rounded-md" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-2/5" />
            </div>
          </div>
        </SidebarMenuItem>
      ))}
    </>
  );
}

export function SourcesPanel({ notebookId }: { notebookId: string }) {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useNotebookSources(notebookId);
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);

  const sources = data ?? [];

  const openAddSourceModal = () => {
    router.push(`/notebook/${notebookId}?addSource=true`, { scroll: false });
  };

  return (
    <SidebarGroup className="gap-1 py-0">
      <SidebarGroupLabel className="justify-between gap-2 px-2 text-[11px] font-semibold tracking-wider text-sidebar-foreground/60">
        <span className="uppercase">Sources</span>
        {!isLoading && sources.length > 0 ? (
          <span className="rounded-full bg-sidebar-accent px-1.5 py-px text-[10px] font-medium text-sidebar-foreground/70 tabular-nums">
            {sources.length}
          </span>
        ) : null}
      </SidebarGroupLabel>

      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Add sources"
              onClick={openAddSourceModal}
              className="h-9 justify-center border border-dashed border-sidebar-border bg-sidebar-accent/40 text-muted-foreground shadow-none hover:border-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <Plus className="size-4" />
              <span className="text-[13px] font-medium group-data-[collapsible=icon]:hidden">
                Add sources
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isLoading ? (
            <SourcesSkeleton />
          ) : isError ? (
            <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
              <div className="mx-2 flex flex-col items-center gap-2 rounded-lg border border-dashed border-sidebar-border px-3 py-5 text-center">
                <AlertCircle className="size-5 text-destructive" />
                <p className="text-xs text-muted-foreground">
                  Couldn&apos;t load sources.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-[11px] font-medium text-sidebar-foreground underline underline-offset-2 hover:text-primary"
                >
                  Try again
                </button>
              </div>
            </SidebarMenuItem>
          ) : sources.length === 0 ? (
            <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
              <div className="mx-1 flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-sidebar-border/80 px-3 py-6 text-center">
                <LibraryBig className="mb-1 size-6 text-muted-foreground/50" />
                <p className="text-xs font-medium text-sidebar-foreground">
                  No sources yet
                </p>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Upload a PDF to start building this notebook.
                </p>
              </div>
            </SidebarMenuItem>
          ) : (
            sources.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                isActive={selectedSourceId === source.id}
                onSelect={() => setSelectedSourceId(source.id)}
              />
            ))
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
