"use client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "../ui/dialog";
import { useCallback, useRef } from "react";
import { useUploadSource } from "@/tanstack/queries/source.query";

interface AddSourceModalProps {
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export const AddSourceModal = ({
  open,
  onOpenChange,
  notebookId,
}: AddSourceModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadSource = useUploadSource(notebookId);

  const uploadDocumentFiles = useCallback(async (files: File[]) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log("🚀 ~ AddSourceModal ~ file:", file);
      await uploadSource.mutateAsync({ file });
    }
  }, []);
  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await uploadDocumentFiles(files);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger>Open</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            <div
              className=" h-[100px] p-4 border-red-400 border"
              onClick={() => fileInputRef.current?.click()}
            >
              Drop document files here PDF, Word, Excel, TXT, MD, JSON, HTML up
              to 50MB each
            </div>

            <input
              className="hidden"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelection}
            />
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
export const AddSourceModalHost = ({ notebookId }: { notebookId: string }) => {
  const searchParams = useSearchParams();
  const open = searchParams.get("addSource") === "true";
  const router = useRouter();
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      router.replace(`/notebook/${notebookId}`, { scroll: false });
    }
  };
  return (
    <AddSourceModal
      notebookId={notebookId}
      open={open}
      onOpenChange={handleOpenChange}
    />
  );
};
