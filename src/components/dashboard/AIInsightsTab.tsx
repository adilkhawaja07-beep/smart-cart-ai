import { useState, useEffect, useRef } from "react";
import { useChat } from "@/hooks/useChat";
import ReactMarkdown from "react-markdown";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AIInsightsTab = () => {
  const { messages, isLoading, send, clearMessages } = useChat("management");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    send(input.trim());
    setInput("");
  };

  const quickPrompts = [
    "What are my top selling products?",
    "Show me profitability analysis by product",
    "Which products need restocking?",
    "Calculate inventory turnover ratios",
    "Give me strategic recommendations for growth",
    "What's my days sales of inventory (DSI)?",
    "Suggest pricing optimizations",
    "What products should I promote next?",
  ];

  return (
    <Card className="flex h-[600px] flex-col">
      <CardHeader className="border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <MessageCircle className="h-5 w-5 text-primary" />
              AI Business Intelligence
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Ask about sales, inventory, profitability, and strategy</p>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearMessages} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-4 py-8">
              <p className="text-sm text-muted-foreground text-center">Try one of these queries:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs text-foreground hover:bg-accent transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <div className="flex gap-1">
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, profitability, inventory..."
              className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-full" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};
