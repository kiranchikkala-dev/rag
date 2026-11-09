import type { ChatMessage } from "@/components/notebook/chat/message-list";

type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

const chatEndpoint = (notebookId: string) =>
  `/api/notebooks/${encodeURIComponent(notebookId)}/chat`;

async function responseError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  return new Error(body?.error ?? fallback);
}

export const notebookChatClient = {
  async getMessages(notebookId: string): Promise<ChatMessage[]> {
    const response = await fetch(chatEndpoint(notebookId));
    if (!response.ok) {
      throw await responseError(response, "Couldn't load the conversation.");
    }

    const result = (await response.json()) as ApiResponse<ChatMessage[]>;
    if (!result.success || !Array.isArray(result.data)) {
      throw new Error(result.error ?? "Couldn't load the conversation.");
    }
    return result.data;
  },

  async *streamMessage(
    notebookId: string,
    query: string,
  ): AsyncGenerator<string> {
    const response = await fetch(chatEndpoint(notebookId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw await responseError(response, "Couldn't get a response. Please try again.");
    }
    if (!response.body) {
      throw new Error("The response stream was unavailable.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      while (true) {
        const { done, value } = await reader.read();
        const text = decoder.decode(value, { stream: !done });
        if (text) yield text;
        if (done) break;
      }
    } finally {
      reader.releaseLock();
    }
  },
};
