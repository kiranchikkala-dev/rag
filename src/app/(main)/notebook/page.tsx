"use client";

import NotebookGrid from "@/components/dashboard/notebook-grid";
import { Button } from "@/components/ui/button";
import { useNotebookCreate } from "@/hooks/use-notebook-create";
import React from "react";

const NotebookPage = () => {
  const { isCreating, create } = useNotebookCreate();

  return (
    <div>
      <Button variant={"secondary"} onClick={() => void create()}>
        Click
      </Button>
      <NotebookGrid />
    </div>
  );
};

export default NotebookPage;
