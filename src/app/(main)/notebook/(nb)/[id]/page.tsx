import React from "react";

const NotebookPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id: notebookId } = await params;
  return (
    <div>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipisicing elit. Fuga ipsam
        vero molestias facere illum suscipit quasi, cumque nostrum possimus
        quos! Ducimus a voluptatum dolor aliquid quo tempora aperiam ut
        quisquam!
      </p>
    </div>
  );
};

export default NotebookPage;
