"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatCitation, ChatMessage } from "@/components/notebook/chat/message-list";
import { notebookChatClient } from "@/tanstack/client/notebook-chat.client";

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

export function useNotebookChat(notebookId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    let active = true;

    notebookChatClient
      .getMessages(notebookId)
      .then((history) => {
        if (active) setMessages(history);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Couldn't load the conversation.",
        );
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [notebookId]);

  const sendMessage = useCallback(
    async (question: string) => {
      const query = question.trim();
      if (!query || isLoadingHistory || sendingRef.current) return;

      sendingRef.current = true;
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: query,
      };
      const assistantId = crypto.randomUUID();

      setMessages((current) => [
        ...current,
        userMessage,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setError(null);
      setIsStreaming(true);

      try {
        let responseText = "";
        for await (const text of notebookChatClient.streamMessage(notebookId, query)) {
          responseText += text;
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
        }
      } catch (sendError) {
        setError(
          sendError instanceof Error
            ? sendError.message
            : "Something went wrong. Please try again.",
        );
        setMessages((current) =>
          current.filter((message) => message.id !== assistantId),
        );
      } finally {
        sendingRef.current = false;
        setIsStreaming(false);
      }
    },
    [isLoadingHistory, notebookId],
  );

  return { messages, isStreaming, isLoadingHistory, error, sendMessage };
}
