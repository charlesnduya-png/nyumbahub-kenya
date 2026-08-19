"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Inbox, Loader2, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn, formatRelativeDate } from "@/lib/utils";

type Conversation = {
  peerId: string;
  peerName: string;
  peerImage: string | null;
  propertyId: string | null;
  propertyTitle: string | null;
  propertySlug: string | null;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

type ChatMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  propertyId: string | null;
  createdAt: string;
  sender: { id: string; name: string | null; image: string | null };
};

type PeerInfo = {
  id: string;
  name: string | null;
  image: string | null;
  email?: string | null;
  phone?: string | null;
};

interface InboxChatProps {
  title?: string;
  subtitle?: string;
  emptyHint?: string;
}

export function InboxChat({
  title = "Inbox",
  subtitle = "Chat with guests, buyers, and hosts on Your Home.",
  emptyHint = "When someone books your BnB or sends an enquiry, the conversation appears here.",
}: InboxChatProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const myId = session?.user?.id ?? null;
  const initialPeer = searchParams.get("peer");
  const initialProperty = searchParams.get("property");

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peer, setPeer] = useState<PeerInfo | null>(null);
  const [property, setProperty] = useState<{
    id: string;
    title: string;
    slug: string;
  } | null>(null);
  const [selectedPeerId, setSelectedPeerId] = useState<string | null>(
    initialPeer,
  );
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(
    initialProperty,
  );
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      const json = (await res.json()) as {
        success?: boolean;
        data?: Conversation[];
        unreadCount?: number;
        error?: string;
      };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load inbox");
        return;
      }
      setConversations(json.data ?? []);
      setUnreadTotal(json.unreadCount ?? 0);
    } catch {
      toast.error("Could not load inbox");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadThread = useCallback(
    async (peerId: string, propertyId: string | null) => {
      setLoadingThread(true);
      try {
        const params = new URLSearchParams({ peerId });
        if (propertyId) params.set("propertyId", propertyId);

        const res = await fetch(`/api/messages?${params.toString()}`);
        const json = (await res.json()) as {
          success?: boolean;
          data?: ChatMessage[];
          peer?: PeerInfo;
          property?: { id: string; title: string; slug: string } | null;
          error?: string;
        };

        if (!res.ok || !json.success) {
          toast.error(json.error ?? "Could not load conversation");
          return;
        }

        setMessages(json.data ?? []);
        setPeer(json.peer ?? null);
        setProperty(json.property ?? null);
      } catch {
        toast.error("Could not load conversation");
      } finally {
        setLoadingThread(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadConversations();
    const interval = setInterval(() => {
      void loadConversations();
      if (selectedPeerId) {
        void loadThread(selectedPeerId, selectedPropertyId);
      }
    }, 12000);
    return () => clearInterval(interval);
  }, [loadConversations, loadThread, selectedPeerId, selectedPropertyId]);

  useEffect(() => {
    if (selectedPeerId) {
      void loadThread(selectedPeerId, selectedPropertyId);
    }
  }, [selectedPeerId, selectedPropertyId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initialPeer) {
      setSelectedPeerId(initialPeer);
      setSelectedPropertyId(initialProperty);
    }
  }, [initialPeer, initialProperty]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.peerName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        (c.propertyTitle?.toLowerCase().includes(q) ?? false),
    );
  }, [conversations, query]);

  function selectConversation(c: Conversation) {
    setSelectedPeerId(c.peerId);
    setSelectedPropertyId(c.propertyId);
    const params = new URLSearchParams({ peer: c.peerId });
    if (c.propertyId) params.set("property", c.propertyId);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  async function sendMessage() {
    if (!selectedPeerId || !draft.trim()) {
      toast.error("Write a message first");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: selectedPeerId,
          content: draft.trim(),
          propertyId: selectedPropertyId,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: ChatMessage;
        error?: string;
      };

      if (!res.ok || !json.success || !json.data) {
        toast.error(json.error ?? "Could not send message");
        return;
      }

      setDraft("");
      setMessages((prev) => [...prev, json.data!]);
      void loadConversations();
    } catch {
      toast.error("Could not send message");
    } finally {
      setSending(false);
    }
  }

  const activeConversation = conversations.find(
    (c) =>
      c.peerId === selectedPeerId &&
      c.propertyId === selectedPropertyId,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        {unreadTotal > 0 ? (
          <Badge variant="secondary">{unreadTotal} unread</Badge>
        ) : null}
      </div>

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border bg-card lg:grid-cols-[340px_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search conversations…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">{emptyHint}</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={`${c.peerId}:${c.propertyId ?? ""}`}
                  type="button"
                  onClick={() => selectConversation(c)}
                  className={cn(
                    "w-full border-b px-4 py-3 text-left transition hover:bg-muted/50",
                    selectedPeerId === c.peerId &&
                      selectedPropertyId === c.propertyId &&
                      "bg-primary/5",
                    c.unreadCount > 0 && "bg-emerald-500/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        c.unreadCount > 0 ? "font-semibold" : "font-medium",
                      )}
                    >
                      {c.peerName}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeDate(c.lastMessageAt)}
                    </span>
                  </div>
                  {c.propertyTitle ? (
                    <p className="mt-0.5 truncate text-xs text-primary">
                      {c.propertyTitle}
                    </p>
                  ) : null}
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {c.lastMessage}
                  </p>
                  {c.unreadCount > 0 ? (
                    <Badge className="mt-1 h-5" variant="default">
                      {c.unreadCount} new
                    </Badge>
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {selectedPeerId ? (
            <>
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">
                  {peer?.name ?? activeConversation?.peerName ?? "Chat"}
                </h2>
                {property ? (
                  <p className="text-sm text-muted-foreground">
                    About{" "}
                    <Link
                      href={`/properties/${property.slug}`}
                      className="text-primary hover:underline"
                    >
                      {property.title}
                    </Link>
                  </p>
                ) : activeConversation?.propertyTitle ? (
                  <p className="text-sm text-muted-foreground">
                    {activeConversation.propertyTitle}
                  </p>
                ) : null}
              </div>

              <div className="flex max-h-[380px] flex-1 flex-col gap-3 overflow-y-auto p-4">
                {loadingThread && messages.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading messages…
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No messages yet. Say hello to start the conversation.
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMine = myId != null && m.senderId === myId;

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex",
                          isMine ? "justify-end" : "justify-start",
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                            isMine
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted",
                          )}
                        >
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p
                            className={cn(
                              "mt-1 text-[10px]",
                              isMine
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground",
                            )}
                          >
                            {formatRelativeDate(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder="Type your message…"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="shrink-0 self-end"
                    disabled={sending || !draft.trim()}
                    onClick={() => void sendMessage()}
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
