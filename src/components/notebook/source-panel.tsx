"use client";
import { useNotebookSources } from "@/tanstack/queries/source.query";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Icon } from "lucide-react";
import { useRouter } from "next/navigation";

export function SourcesPanel({ notebookId }: { notebookId: string }) {
  console.log("🚀 ~ SourcesPanel ~ notebookId:", notebookId);
  const router = useRouter();
  const { data } = useNotebookSources(notebookId);

  const openAddSourceModal = () => {
    router.push(`/notebook/${notebookId}?addSource=true`, { scroll: false });
  };

  return (
    <div>
      <SidebarGroup className="py-0">
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem
              className="flex items-center gap-2 group-data-[collapsible=icon]:bg-transparent! text-red-400! bg-border  border-black bg-secondary p-2 rounded-xl cursor-pointer hover:bg-secondary/90 transition-colors"
              onClick={openAddSourceModal}
            >
              {/* <Icon
                icon={"carbon:add-filled"}
                className="shrink-0 size-5 group-data-[collapsible=icon]:size-7 ring-3 ring-muted rounded-full text-primary
              "
              /> */}
              <span className="truncate">Add sources</span>
            </SidebarMenuItem>

            {/* <SidebarAddSourceInput notebookId={notebookId} /> */}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
