"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AiChatAssistant = dynamic(
  () =>
    import("@/components/ai/chat-assistant").then((m) => ({
      default: m.AiChatAssistant,
    })),
  { ssr: false },
);

export function LazyChatAssistant() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!ready) return null;
  return <AiChatAssistant />;
}
