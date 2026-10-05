"use client";
import { useNotebookSources } from "@/tanstack/queries/source.query";

export function SourcesPanel({ notebookId }: { notebookId: string }) {
  console.log("🚀 ~ SourcesPanel ~ notebookId:", notebookId);
  const { data } = useNotebookSources(notebookId);
  console.log("🚀 ~ SourcePanel ~ data:", data);
}
