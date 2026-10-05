import { ApiResponse } from "@/types/api.type";
import { apiClient } from "../api";
import { CreateNotebookPayload, NotebookListItem } from "@/types/notebook.type";

export const notebookClient = {
  getNotebooks: async () => {
    const { data } =
      await apiClient.get<ApiResponse<NotebookListItem[]>>("/notebooks");
    return data;
  },
  createNoteBook: async (payload: CreateNotebookPayload) => {
    const { data } = await apiClient.post<ApiResponse>("/notebooks", payload);
    return data;
  },
};
