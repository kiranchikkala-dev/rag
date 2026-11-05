"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUp,
  BookOpenText,
  Bot,
  LoaderCircle,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type ChatCitation = {
  label: string;
  source: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
};

const STARTER_PROMPTS = [
  "What are the main ideas in my sources?",
  "Summarize the key takeaways",
  "What should I pay attention to?",
];

function splitCitations(text: string): {
  answer: string;
  citations: ChatCitation[];
} {
  const sourcesStart = text.lastIndexOf("\n\nSources:\n");
  if (sourcesStart === -1) return { answer: text.trim(), citations: [] };

  const answer = text.slice(0, sourcesStart).trim();
  const sourcesText = text.slice(sourcesStart + "\n\nSources:\n".length);
  const citations = sourcesText
    .split("\n")
    .map((line) => {
      const match = line.match(/^\[(\d+)\]\s+(.+)$/);
      return match ? { label: match[1], source: match[2] } : null;
    })
    .filter((citation): citation is ChatCitation => citation !== null);

  return { answer, citations };
}

export function ChatPanel({ notebookId }: { notebookId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    transcriptRef.current?.scrollTo({
      top: transcriptRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function sendMessage(question: string) {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isStreaming) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedQuestion,
    };
    const assistantId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      userMessage,
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setQuery("");
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch(
        `/api/notebooks/${encodeURIComponent(notebookId)}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: trimmedQuestion }),
        },
      );

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? "Couldn't get a response. Please try again.",
        );
      }
      if (!response.body)
        throw new Error("The response stream was unavailable.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = "";

      while (true) {
        const { done, value } = await reader.read();
        responseText += decoder.decode(value, { stream: !done });
        const parsed = splitCitations(responseText);

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content: parsed.answer,
                  citations: parsed.citations,
                }
              : message,
          ),
        );

        if (done) break;
      }
    } catch (sendError) {
      const message =
        sendError instanceof Error
          ? sendError.message
          : "Something went wrong. Please try again.";
      setError(message);
      setMessages((current) =>
        current.filter((item) => item.id !== assistantId),
      );
    } finally {
      setIsStreaming(false);
      textareaRef.current?.focus();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(query);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(query);
    }
  }

  return (
    <section
      className="flex h-full  min-h-0 w-full min-w-0 flex-col overflow-hidden bg-background"
      aria-label="Notebook chat"
    >
      <header className="flex shrink-0 items-center justify-between border-b px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-sm font-semibold">Ask your notebook</h1>
            <p className="text-xs text-muted-foreground">
              Answers grounded in your sources
            </p>
          </div>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs text-muted-foreground sm:inline-flex">
          <BookOpenText className="size-3.5" aria-hidden="true" />
          Notebook sources
        </span>
      </header>

      <div ref={transcriptRef} className="min-h-0 flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
            <span className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/5 text-primary ring-1 ring-primary/10">
              <BookOpenText className="size-7" aria-hidden="true" />
            </span>
            <h2 className="text-xl font-semibold tracking-tight">
              What would you like to learn?
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Ask a question about the material in this notebook. I’ll use your
              sources and show where the answer came from.
            </p>
            <div className="mt-7 flex max-w-2xl flex-wrap justify-center gap-2">
              {STARTER_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isStreaming}
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border bg-card px-3.5 py-2 text-xs text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-5 py-8">
            {messages.map((message) => (
              <article
                key={message.id}
                className="flex gap-3"
                aria-label={`${message.role} message`}
              >
                <span
                  className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                    message.role === "user"
                      ? "bg-muted text-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {message.role === "user" ? (
                    <UserRound className="size-4" aria-hidden="true" />
                  ) : (
                    <Bot className="size-4" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="mb-1.5 text-xs font-semibold capitalize text-muted-foreground">
                    {message.role === "user" ? "You" : "Notebook assistant"}
                  </p>
                  {message.content ? (
                    <div className="whitespace-pre-wrap break-words text-sm leading-7">
                      {message.content}
                    </div>
                  ) : message.role === "assistant" && isStreaming ? (
                    <div
                      className="flex items-center gap-2 py-1 text-sm text-muted-foreground"
                      role="status"
                    >
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Searching your sources…
                    </div>
                  ) : null}
                  {message.citations && message.citations.length > 0 ? (
                    <div className="mt-4 border-t pt-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        Sources
                      </p>
                      <ul className="flex flex-wrap gap-2">
                        {message.citations.map((citation) => (
                          <li
                            key={`${citation.label}-${citation.source}`}
                            className="inline-flex max-w-full items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs text-muted-foreground"
                          >
                            <BookOpenText
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="font-medium text-foreground">
                              [{citation.label}]
                            </span>
                            <span className="truncate">{citation.source}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t bg-background px-4 py-4 sm:px-6">
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
            className="relative rounded-xl border bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring/30"
          >
            <Textarea
              ref={textareaRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your sources…"
              aria-label="Ask a question about this notebook"
              maxLength={200}
              disabled={isStreaming}
              rows={2}
              className="max-h-40 min-h-16 resize-none border-0 bg-transparent pr-14 shadow-none focus-visible:border-transparent focus-visible:ring-0"
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
                  disabled={!query.trim() || isStreaming}
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
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Responses are generated from this notebook’s sources and may need
            verification.
          </p>
        </div>
      </div>
    </section>
  );
}
