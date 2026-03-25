import { useState, useRef, useCallback } from "react";
import { ChatService, type ChatMessage } from "@/lib/services/chatService";

/**
 * A cleaner, refactored useChat hook that separates concerns
 * - ChatService handles streaming logic
 * - Hook handles React state management
 */
export function useChatRefactored(interfaceType: "customer" | "management") {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const conversationId = useRef(crypto.randomUUID());

  const send = useCallback(
    async (input: string) => {
      const userMsg: ChatMessage = { role: "user", content: input };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsLoading(true);

      let assistantSoFar = "";

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
            );
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      try {
        for await (const event of ChatService.streamMessage(
          newMessages,
          conversationId.current,
          interfaceType
        )) {
          if (event.type === "chunk" && event.content) {
            upsertAssistant(event.content);
          } else if (event.type === "error") {
            upsertAssistant(
              `\n\n*Error: ${event.error || "Something went wrong"}*`
            );
          }
        }
      } catch (e) {
        console.error("Chat error:", e);
        upsertAssistant(
          `\n\n*Error: ${e instanceof Error ? e.message : "Something went wrong"}*`
        );
      } finally {
        setIsLoading(false);
      }
    },
    [messages, interfaceType]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationId.current = crypto.randomUUID();
  }, []);

  return { messages, isLoading, send, clearMessages };
}
