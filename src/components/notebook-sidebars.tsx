import React, { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { SidebarInset } from "./ui/sidebar";
import { SourcesPanel } from "@/components/notebook/source-panel";
export const NotebookLeftSidebar = ({
  children,
  notebookId,
}: {
  notebookId: string;
  children: ReactNode;
}) => {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      <AppSidebar
        content={<SourcesPanel notebookId={notebookId} />}
        side="left"
      >
        <SidebarInset className="h-full min-w-0 overflow-hidden">
          <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </AppSidebar>
    </div>
  );
};
// export const NotebookRightSidebar = () => {
//   return (
//     <div>
//       <AppSidebar side="right" />
//     </div>
//   );
// };
