"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { toast } from "sonner";
import { useUploadSource } from "@/tanstack/queries/source.query";
import { cn } from "@/app/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";

const MAX_PDF_FILE_SIZE = 50 * 1024 * 1024;

interface AddSourceModalProps {
  notebookId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadProgress = {
  done: number;
  total: number;
  currentFile?: string;
};

function isPdf(file: File) {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function AddSourceModal({
  open,
  onOpenChange,
  notebookId,
}: AddSourceModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    done: 0,
    total: 0,
  });
  const uploadSource = useUploadSource(notebookId);

  const isUploading = uploadProgress.total > 0;
  const progressPercentage = isUploading
    ? Math.round((uploadProgress.done / uploadProgress.total) * 100)
    : 0;

  const uploadPdfFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || isUploading) return;

      const pdfFiles = files.filter(isPdf);
      const unsupportedCount = files.length - pdfFiles.length;

      if (unsupportedCount > 0) {
        toast.error(
          `${unsupportedCount === 1 ? "That file is" : `${unsupportedCount} files are`} not a PDF. Only PDF files can be uploaded.`,
        );
      }

      const oversizedFiles = pdfFiles.filter(
        (file) => file.size > MAX_PDF_FILE_SIZE,
      );
      if (oversizedFiles.length > 0) {
        toast.error(
          `${oversizedFiles[0].name} is larger than the 50 MB limit.`,
        );
      }

      const supportedFiles = pdfFiles.filter(
        (file) => file.size <= MAX_PDF_FILE_SIZE,
      );
      if (supportedFiles.length === 0) return;

      setUploadProgress({ done: 0, total: supportedFiles.length });
      let uploadedCount = 0;

      for (const [index, file] of supportedFiles.entries()) {
        setUploadProgress({
          done: index,
          total: supportedFiles.length,
          currentFile: file.name,
        });

        try {
          await uploadSource.mutateAsync({ file });
          uploadedCount += 1;
        } catch (error) {
          toast.error(
            error instanceof Error
              ? error.message
              : `Failed to upload ${file.name}.`,
          );
        }
      }

      setUploadProgress({
        done: supportedFiles.length,
        total: supportedFiles.length,
      });

      if (uploadedCount > 0) {
        toast.success(
          uploadedCount === 1
            ? "PDF uploaded. Indexing in the background."
            : `${uploadedCount} PDFs uploaded. Indexing in the background.`,
        );
        setIsDragging(false);
        setUploadProgress({ done: 0, total: 0 });
        onOpenChange(false);
      } else {
        setUploadProgress({ done: 0, total: 0 });
      }
    },
    [isUploading, onOpenChange, uploadSource],
  );

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    await uploadPdfFiles(files);
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await uploadPdfFiles(Array.from(event.dataTransfer.files));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isUploading) return;

    if (!nextOpen) {
      setIsDragging(false);
      setUploadProgress({ done: 0, total: 0 });
    }

    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full max-w-lg gap-0 overflow-hidden p-0">
        <div className="border-b bg-muted/25 px-6 py-5">
          <DialogHeader className="gap-3">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-destructive/15">
                <FileText className="size-5" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="text-lg">Upload a PDF</DialogTitle>
                <DialogDescription>
                  Add one or more PDF files to this notebook.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div
            role="button"
            tabIndex={isUploading ? -1 : 0}
            aria-disabled={isUploading}
            onDragEnter={(event) => {
              event.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUploading) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (
                !isUploading &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={cn(
              "group flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors",
              isUploading
                ? "cursor-wait border-primary/30 bg-primary/5"
                : isDragging
                  ? "cursor-copy border-primary bg-primary/10"
                  : "cursor-pointer border-border bg-muted/20 hover:border-primary/60 hover:bg-primary/5",
            )}
          >
            {isUploading ? (
              <>
                <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="size-6 animate-spin" />
                </div>
                <p className="max-w-full truncate text-sm font-semibold">
                  Uploading {uploadProgress.done + 1} of {uploadProgress.total}
                </p>
                {uploadProgress.currentFile ? (
                  <p className="mt-1 max-w-full truncate text-xs text-muted-foreground">
                    {uploadProgress.currentFile}
                  </p>
                ) : null}
                <div className="mt-5 w-full max-w-xs space-y-2">
                  <div className="h-1.5 overflow-hidden rounded-full bg-primary/15">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Keep this window open while your PDF is uploaded.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm ring-1 ring-border transition-transform group-hover:-translate-y-0.5">
                  <UploadCloud className="size-7" />
                </div>
                <p className="text-sm font-semibold">
                  Drop your PDF files here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or <span className="font-medium text-primary">browse</span>{" "}
                  from your computer
                </p>
                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-background px-2 py-1 font-medium ring-1 ring-border">
                    PDF only
                  </span>
                  <span aria-hidden="true">•</span>
                  <span>Up to 50 MB per file</span>
                </div>
              </>
            )}
          </div>

          {!isUploading ? (
            <div className="flex items-start gap-3 rounded-xl border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
              <p>
                Your PDF will be processed and indexed automatically after it
                uploads.
              </p>
            </div>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="hidden"
            onChange={handleFileSelection}
          />
        </div>

        <DialogFooter className="border-t bg-muted/20 px-6 py-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AddSourceModalHost({ notebookId }: { notebookId: string }) {
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
}
