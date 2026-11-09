"use client";

import NotebookGrid from "@/components/dashboard/notebook-grid";
import { Button } from "@/components/ui/button";
import { useNotebookCreate } from "@/hooks/use-notebook-create";
import { Plus } from "lucide-react";
import React from "react";

const NotebookPage = () => {
  const { isCreating, create } = useNotebookCreate();

  return (
    <main className="mx-auto w-full max-w-7xl space-y-8 px-6 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Notebooks</h1>
          <p className="text-sm text-muted-foreground">
            Keep your sources and notes organized in one place.
          </p>
        </div>
        <Button onClick={() => void create()} disabled={isCreating}>
          <Plus className="size-4" />
          {isCreating ? "Creating…" : "New notebook"}
        </Button>
      </header>
      <NotebookGrid />
    </main>
  );
};

export default NotebookPage;
