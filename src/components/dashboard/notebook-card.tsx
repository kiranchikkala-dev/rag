"use client";

import { NotebookListItem } from "@/types/notebook.type";
import { useDeleteNotebook, useUpdateNotebook } from "@/tanstack/queries/notebook.query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ArrowRight, Clock, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const NotebookCard = ({ notebook }: { notebook: NotebookListItem }) => {
  const router = useRouter();
  const updateNotebook = useUpdateNotebook();
  const deleteNotebook = useDeleteNotebook();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [title, setTitle] = useState(notebook.title);
  const [description, setDescription] = useState(notebook.description ?? "");

  const openEditor = () => {
    setTitle(notebook.title);
    setDescription(notebook.description ?? "");
    setEditOpen(true);
  };

  const saveNotebook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await updateNotebook.mutateAsync({
        id: notebook.id,
        title: title.trim(),
        description: description.trim(),
      });
      toast.success("Notebook updated");
      setEditOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update notebook");
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteNotebook.mutateAsync(notebook.id);
      toast.success("Notebook deleted");
      setDeleteOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete notebook");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="space-y-1.5 rounded-b-3xl border-border/50 bg-muted p-5 pb-4 dark:bg-sidebar-accent!">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-lg bg-primary/5" />
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon" aria-label={`Actions for ${notebook.title}`} />}
              >
                <Ellipsis className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={openEditor}>
                  <Pencil />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <CardTitle
            onClick={() => router.push(`/notebook/${notebook.id}`)}
            className="cursor-pointer truncate text-lg font-bold transition-colors hover:text-primary"
          >
            {notebook.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {notebook.description || "No description provided."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-between border-0 bg-transparent p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>{new Date(notebook.createdAt).toLocaleDateString()}</span>
          </div>
          <button
            type="button"
            onClick={() => router.push(`/notebook/${notebook.id}`)}
            className="flex items-center gap-1 font-medium text-primary"
          >
            Open <ArrowRight className="size-3.5" />
          </button>
        </CardFooter>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={saveNotebook} className="space-y-5">
            <DialogHeader>
              <DialogTitle>Edit notebook</DialogTitle>
              <DialogDescription>Update the notebook title and description.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <label className="block space-y-2 text-sm font-medium">
                Title
                <Input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} required />
              </label>
              <label className="block space-y-2 text-sm font-medium">
                Description
                <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
              </label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateNotebook.isPending || !title.trim()}>
                {updateNotebook.isPending ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete notebook?</DialogTitle>
            <DialogDescription>
              This will permanently delete “{notebook.title}”. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={deleteNotebook.isPending}>
              {deleteNotebook.isPending ? "Deleting…" : "Delete notebook"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotebookCard;
