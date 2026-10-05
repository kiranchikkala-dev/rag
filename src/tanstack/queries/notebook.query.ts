import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { notebookClient } from "../client/notebook.client";
import { CreateNotebookPayload, NotebookListItem } from "@/types/notebook.type";
import { ApiResponse } from "@/types/api.type";

export const notebookQueryKeys = {
  all: ["notebooks"] as const,
  create: ["notebooks", "create"] as const,
};

export const useNotebooks = () => {
  return useQuery({
    queryKey: notebookQueryKeys.all,
    queryFn: async () => {
      const response = await notebookClient.getNotebooks();
      return response?.data;
    },
  });
};
export const useCreateNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ApiResponse<NotebookListItem>,
    Error,
    CreateNotebookPayload
  >({
    mutationKey: notebookQueryKeys.create,
    mutationFn: (payload) =>
      notebookClient.createNoteBook(payload) as Promise<
        ApiResponse<NotebookListItem>
      >,
    onSuccess: (res) => {
      const created = res.data;
      if (!created) return;
      queryClient.setQueryData<NotebookListItem[]>(
        notebookQueryKeys.all,
        (current) => [created, ...(current ?? [])],
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notebookQueryKeys.all });
    },
  });
};
