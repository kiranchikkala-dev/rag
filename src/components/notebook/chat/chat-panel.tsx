"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageList } from "./message-list";
import { useNotebookChat } from "@/hooks/use-notebook-chat";

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const [query, setQuery] = useState("");
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, isStreaming, isLoadingHistory, error, sendMessage } =
    useNotebookChat(notebookId);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentQuery = query;
    setQuery("");
    void sendMessage(currentQuery).finally(() => textareaRef.current?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const currentQuery = query;
      setQuery("");
      void sendMessage(currentQuery).finally(() => textareaRef.current?.focus());
    }
  }

  return (
    <section
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background"
      aria-label="Notebook chat"
    >
      <header className="flex shrink-0 items-center border-b px-5 py-3">
        <h1 className="text-sm font-medium">Notebook chat</h1>
      </header>

      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        isLoadingHistory={isLoadingHistory}
        containerRef={transcriptRef}
        onPromptSelect={(prompt) => void sendMessage(prompt)}
      />

      <div className="shrink-0 border-t px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {error ? (
            <p
              className="mb-2 flex items-center gap-2 text-xs text-destructive"
              role="alert"
            >
              <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          ) : null}
          <form
            onSubmit={handleSubmit}
            className="relative rounded-lg border bg-background focus-within:ring-2 focus-within:ring-ring/30"
          >
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your sources…"
              aria-label="Ask a question about this notebook"
              maxLength={200}
              disabled={isStreaming || isLoadingHistory}
              rows={2}
              className="max-h-40 min-h-14 resize-none border-0 bg-transparent pr-14 shadow-none focus-visible:border-transparent focus-visible:ring-0"
            />
            <div className="flex items-center justify-between px-3 pb-2.5">
              <span className="text-[11px] text-muted-foreground">
                Enter to send · Shift+Enter for a new line
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {query.length}/200
                </span>
                <Button
                  type="submit"
                  size="icon-sm"
                  disabled={!query.trim() || isStreaming || isLoadingHistory}
                  aria-label="Send message"
                  className="rounded-lg"
                >
                  {isStreaming ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowUp className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
