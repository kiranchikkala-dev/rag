import { AddSourceModalHost } from "@/components/notebook/add-source-modal";
import { redirect } from "next/navigation";
import React from "react";

const NotebookPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id: notebookId } = await params;
  // Older builds generated notebook links with a trailing `}`. Redirect those
  // stale URLs so an already-open page cannot submit a malformed notebook ID.
  const normalizedNotebookId = notebookId.replace(/}+$/, "");
  if (normalizedNotebookId !== notebookId) {
    redirect(`/notebook/${normalizedNotebookId}`);
  }

  return (
    <div>
      <AddSourceModalHost notebookId={notebookId} />
    </div>
  );
};

export default NotebookPage;
