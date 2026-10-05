import { z } from "zod";
export const notebookListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  createdAt: z.string(),
});

export type NotebookListItem = z.infer<typeof notebookListItemSchema>;

export const createNotebookSchema = z.object({
  title: z.string().trim().min(1).max(120),
});

export type CreateNotebookPayload = z.infer<typeof createNotebookSchema>;
