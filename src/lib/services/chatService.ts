/**
 * Chat Service - handles all chat-related operations
 * Separates streaming logic from React state management
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatStreamEvent {
  type: "chunk" | "error" | "done";
  content?: string;
  error?: string;
}

// Configuration for different chat modes
export const CHAT_CONFIG = {
  customer: {
    systemPrompt: (productContext: string) => `You are FreshCart's friendly shopping assistant. Help customers discover products, check availability, get recommendations, and find substitutions.

Current product catalog:
${productContext}

Guidelines:
- Be warm, helpful, and concise
- Suggest products based on what's in stock
- Mention prices and any active deals/badges
- If something is out of stock, suggest alternatives
- Help with meal planning and recipe suggestions
- When a customer asks for a recipe, ALWAYS suggest recipes using ONLY ingredients available in our store
- Include exact quantities and prices so the customer knows what to buy
- Format recipes with clear ingredient lists (with prices) and step-by-step instructions
- At the end of a recipe, show a "Shopping List" with total estimated cost
- Use markdown for formatting when helpful`,
  },
  management: {
    systemPrompt: (productContext: string, inventoryContext: string, analyticsContext: string) =>
      `You are FreshCart's business intelligence assistant for management. Provide data-driven insights and actionable recommendations.

Product Catalog:
${productContext}

Current Inventory Levels:
${inventoryContext}

Recent Sales Summary (last 100 transactions):
${analyticsContext}

Guidelines:
- Provide specific numbers and calculations
- Calculate metrics like inventory turnover, DSI, gross margin per product
- Identify trends and patterns
- Give actionable business recommendations
- Use markdown tables and formatting for data
- Be analytical and professional`,
  },
};

export class ChatService {
  private static readonly CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
  private static readonly ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  /**
   * Stream a chat message using SSE
   */
  static async *streamMessage(
    messages: ChatMessage[],
    conversationId: string,
    interfaceType: "customer" | "management"
  ): AsyncGenerator<ChatStreamEvent> {
    try {
      const response = await fetch(this.CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.ANON_KEY}`,
        },
        body: JSON.stringify({
          messages,
          conversationId,
          interfaceType,
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed (${response.status})`);
      }

      yield* this.parseStream(response.body);
    } catch (error) {
      yield {
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Parse SSE stream from response body
   */
  private static async *parseStream(
    body: ReadableStream<Uint8Array>
  ): AsyncGenerator<ChatStreamEvent> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            yield { type: "done" };
            return;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              yield { type: "chunk", content };
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export default ChatService;
