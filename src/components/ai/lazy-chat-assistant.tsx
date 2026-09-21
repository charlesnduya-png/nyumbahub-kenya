"use client";

import dynamic from "next/dynamic";

const AiChatAssistant = dynamic(
  () =>
    import("@/components/ai/chat-assistant").then((m) => ({
      default: m.AiChatAssistant,
    })),
  { ssr: false },
);

/** Floating WhatsApp support — load on client without artificial delay. */
export function LazyChatAssistant() {
  return <AiChatAssistant />;
}
