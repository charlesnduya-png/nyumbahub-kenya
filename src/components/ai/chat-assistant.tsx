"use client";

import { useState } from "react";
import { MessageCircle, Send, X, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ChatMessage = { role: "user" | "assistant"; content: string };

const starter =
  "Habari! I'm Your Home's assistant. Ask me about buying, renting, or listing property in Kenya.";

export function AiChatAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: starter },
  ]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: next.slice(-6) }),
      });
      const data = (await res.json()) as {
        reply?: string;
        data?: { reply?: string };
      };
      const reply =
        data.data?.reply ??
        data.reply ??
        "I can help with Kenyan property search, mortgages, and listing tips. Try asking about Nairobi rentals or how to list a home.";
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...next,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Browse /properties or contact an agent from a listing page.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="glass flex h-[420px] w-[min(100vw-2rem,360px)] flex-col overflow-hidden rounded-2xl border shadow-2xl"
          role="dialog"
          aria-label="Your Home AI assistant"
        >
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" aria-hidden />
              <span className="font-medium">Your Home Assistant</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1 hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto bg-background/95 p-4">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={cn(
                  "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                  m.role === "assistant"
                    ? "bg-muted text-foreground"
                    : "ml-auto bg-primary text-primary-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {loading && (
              <p className="text-xs text-muted-foreground">Thinking…</p>
            )}
          </div>
          <form
            className="flex gap-2 border-t bg-background p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about property in Kenya…"
              aria-label="Chat message"
            />
            <Button type="submit" size="icon" disabled={loading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
      <Button
        size="lg"
        className="h-14 rounded-full px-5 shadow-lg"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Open AI property assistant"
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        Ask AI
      </Button>
    </div>
  );
}
