import { NotebookListItem } from "@/types/notebook.type";
import React from "react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { ArrowRight, Clock, Icon } from "lucide-react";
import { useRouter } from "next/navigation";

const NotebookCard = ({ notebook }: { notebook: NotebookListItem }) => {
  const { title, createdAt } = notebook;
  const router = useRouter();
  return (
    <div>
      <Card>
        <CardHeader className="flex-1 space-y-1.5 pb-4 rounded-b-3xl p-5 bg-muted dark:bg-sidebar-accent! border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-primary transition-colors group-hover:bg-primary/10">
              {/* <Icon icon={"solar:book-broken"} className="size-5" /> */}
            </div>
          </div>

          <CardTitle
            onClick={() => router.push(`/notebook/${notebook?.id}}`)}
            className="truncate font-bold text-lg transition-colors group-hover:text-primary"
          >
            {notebook.title}
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed">
            {notebook.description || "No description provided."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="text-xs border-0 bg-transparent text-muted-foreground p-3">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>{new Date(notebook.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            <span>Open</span>
            <ArrowRight className="size-3.5" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default NotebookCard;
