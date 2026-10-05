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
    <div>
      <AppSidebar
        content={<SourcesPanel notebookId={notebookId} />}
        side="left"
      >
        <SidebarInset className="h-full overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
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
