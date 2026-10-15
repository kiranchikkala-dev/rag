"use client";
import { useCreateNotebook } from "@/tanstack/queries/notebook.query";
import { CreateNotebookPayload } from "@/types/notebook.type";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function useNotebookCreate() {
  const createNotebook = useCreateNotebook();
  const router = useRouter();

  const create = async (payload: CreateNotebookPayload = { title: "Untitled notebook" }) => {
    try {
      const res = await createNotebook.mutateAsync(payload);
      if (!res.data) {
        throw new Error("Failed to create notebook");
      }

      toast.success("Created new notebook!");
      router.push(`/notebook/${res.data.id}?addSource=true`);
    } catch (error) {
      toast.error(error instanceof Error ? error?.message : "Failed to create");
    }
  };

  return {
    isCreating: createNotebook.isPending,
    create,
  };
}
