import { ApiResponse } from "@/types/api.type";
import {
  CreateSourceResult,
  EmbedSourceBatchResult,
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

    // Read the response safely before parsing JSON.
    const responseText = await response.text();

    let result: ApiResponse<CreateSourceResult> | null = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText) as ApiResponse<CreateSourceResult>;
      } catch {
        throw new Error(
          `Invalid JSON response from server (HTTP ${response.status})`,
        );
      }
    }

    if (!response.ok || !result?.success) {
      throw new Error(
        result?.error || `Upload failed with HTTP ${response.status}`,
      );
    }

    return result;
  },

  embedSourceBatch: async (sourceId: string) => {
    const { data } = await apiClient.post<ApiResponse<EmbedSourceBatchResult>>(
      `/sources/${sourceId}/embed`,
    );
    return data;
  },
};
