import { NotebookLeftSidebar } from "@/components/notebook-sidebars";
import { SidebarProvider } from "@/components/ui/sidebar";
import React from "react";

const Layout = async ({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) => {
  const notebookId = await params.then((p) => p.id);
  console.log("🚀 ~ Layout ~ notebookId:", notebookId);

  return (
    <div className="flex h-[calc(100dvh-60px)] w-full flex-col overflow-hidden">
      <SidebarProvider className="flex h-full min-h-0">
        <SidebarProvider className="flex min-h-0 min-w-0 flex-1 pt-3 ">
          <NotebookLeftSidebar notebookId={notebookId}>
            {children}
          </NotebookLeftSidebar>
        </SidebarProvider>
      </SidebarProvider>
    </div>
  );
};

export default Layout;
