import { ApiResponse } from "@/types/api.type";
import {
  CreateSourceResult,
  NotebookSourceListItem,
} from "@/types/source.type";
import { apiClient } from "../api";
import { NotebookListItem } from "@/types/notebook.type";

export const sourceClient = {
  getNotebookSources: async (notebookId: string) => {
    const { data } = await apiClient.get<ApiResponse<NotebookSourceListItem[]>>(
      `/notebooks/${notebookId}/sources`,
    );
    return data || [];
  },
  uploadSource: async (notebookId: string, file: File, title?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("notebookId", notebookId);
    if (title?.trim()) {
      formData.append("title", title.trim());
    }

    const response = await fetch("/api/sources/upload", {
      method: "POST",
      body: formData,
    });

    const result = (await response.json()) as ApiResponse<CreateSourceResult>;

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Failed to upload source");
    }

    return result;
  },
};
