"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sourceClient } from "../client/source.client";
import { sourceQueryKeys } from "./source.query-keys";

export const useUploadSource = (notebookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) =>
      sourceClient.uploadSource(notebookId, file, title),
    onSuccess: (result) => {
      // handleCreatedSources(
      //   notebookId,
      //   result.data?.source ? [result.data.source] : [],
      //   queryClient,
      // );
    },
  });
};

export const useNotebookSources = (
  notebookId: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: sourceQueryKeys.notebookSources(notebookId),
    queryFn: async () => {
      const res = await sourceClient.getNotebookSources(notebookId);
      return res.data || [];
    },
    enabled: !!notebookId && enabled,
    // refetchInterval: (query) =>
    // hasProcessingSources(query.state.data) ? 2000 : false,
  });
};
