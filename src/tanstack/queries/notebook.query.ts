import {
  useMutation,
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

export type UpdateNotebookPayload = CreateNotebookPayload & { id: string };

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

export const useUpdateNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateNotebookPayload) =>
      notebookClient.updateNotebook(id, payload),
    onSuccess: (response) => {
      if (response.data) {
        queryClient.setQueryData<NotebookListItem[]>(notebookQueryKeys.all, (current) =>
          current?.map((notebook) =>
            notebook.id === response.data?.id ? response.data : notebook,
          ),
        );
      }
      queryClient.invalidateQueries({ queryKey: notebookQueryKeys.all });
    },
  });
};

export const useDeleteNotebook = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notebookClient.deleteNotebook(id),
    onSuccess: (_response, id) => {
      queryClient.setQueryData<NotebookListItem[]>(notebookQueryKeys.all, (current) =>
        current?.filter((notebook) => notebook.id !== id),
      );
      queryClient.invalidateQueries({ queryKey: notebookQueryKeys.all });
    },
  });
};
