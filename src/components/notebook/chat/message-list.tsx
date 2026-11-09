import type { RefObject } from "react";
import { BookOpenText, LoaderCircle } from "lucide-react";

export type ChatCitation = {
  label: string;
  source: string;
};

export type ChatMessage = {
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

type MessageListProps = {
  messages: ChatMessage[];
  isStreaming: boolean;
  isLoadingHistory: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
  onPromptSelect: (prompt: string) => void;
};

export function MessageList({
  messages,
  isStreaming,
  isLoadingHistory,
  containerRef,
  onPromptSelect,
}: MessageListProps) {
  return (
    <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto">
      {isLoadingHistory ? (
        <div className="flex min-h-full items-center justify-center px-5 text-sm text-muted-foreground" role="status">
          Loading conversation…
        </div>
      ) : messages.length === 0 ? (
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center px-5 py-12 text-center">
          <h2 className="text-lg font-medium tracking-tight">
            What would you like to know?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask a question about your notebook sources.
          </p>
          <div className="mt-5 flex max-w-2xl flex-wrap justify-center gap-2">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={isStreaming}
                onClick={() => onPromptSelect(prompt)}
                className="rounded-md border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-5 py-8">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              aria-label={`${message.role} message`}
            >
              <div
                className={`min-w-0 ${
                  message.role === "user"
                    ? "max-w-[85%] rounded-lg bg-muted px-4 py-3 sm:max-w-[75%]"
                    : "max-w-full"
                }`}
              >
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
  );
}
