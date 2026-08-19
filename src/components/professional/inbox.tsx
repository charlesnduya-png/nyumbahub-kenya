"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Archive,
  Inbox,
  MailOpen,
  MessageSquare,
  Phone,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  type ProfessionalInboxMessage,
} from "@/data/professional";
import { cn, formatRelativeDate } from "@/lib/utils";

export function ProfessionalInbox() {
  const [messages, setMessages] = useState<ProfessionalInboxMessage[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.fromName.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q) ||
        (m.propertyTitle?.toLowerCase().includes(q) ?? false),
    );
  }, [messages, query]);

  const selected =
    filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? null;

  function markStatus(
    id: string,
    status: ProfessionalInboxMessage["status"],
  ) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m)),
    );
  }

  function openMessage(id: string) {
    setSelectedId(id);
    markStatus(id, "READ");
  }

  const unreadCount = messages.filter((m) => m.status === "UNREAD").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-muted-foreground">
            Messages from buyers about your listings.
          </p>
        </div>
        <Badge variant="secondary">{unreadCount} unread</Badge>
      </div>

      <div className="grid min-h-[560px] overflow-hidden rounded-2xl border bg-card lg:grid-cols-[340px_1fr]">
        <div className="border-b lg:border-b-0 lg:border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search inbox…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[480px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No messages.</p>
            ) : (
              filtered.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => openMessage(m.id)}
                  className={cn(
                    "w-full border-b px-4 py-3 text-left transition hover:bg-muted/50",
                    selected?.id === m.id && "bg-primary/5",
                    m.status === "UNREAD" && "bg-emerald-500/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm",
                        m.status === "UNREAD" ? "font-semibold" : "font-medium",
                      )}
                    >
                      {m.fromName}
                    </p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeDate(m.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm">{m.subject}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                    {m.preview}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col">
          {selected ? (
            <>
              <div className="border-b p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.subject}</h2>
                    <p className="text-sm text-muted-foreground">
                      From {selected.fromName} · {selected.fromEmail}
                    </p>
                    {selected.propertyTitle && (
                      <p className="mt-1 text-sm">
                        Listing:{" "}
                        <Link
                          href={`/properties/${selected.propertyId}`}
                          className="text-primary hover:underline"
                        >
                          {selected.propertyTitle}
                        </Link>
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={`tel:${selected.fromPhone}`}>
                        <Phone className="mr-1 h-3.5 w-3.5" />
                        Call
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a
                        href={`https://wa.me/254${selected.fromPhone.replace(/\D/g, "").slice(-9)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <MessageSquare className="mr-1 h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markStatus(selected.id, "ARCHIVED")}
                    >
                      <Archive className="mr-1 h-3.5 w-3.5" />
                      Archive
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-4 p-4">
                <div className="rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed">
                  {selected.body}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="reply">
                    Reply
                  </label>
                  <Textarea
                    id="reply"
                    rows={4}
                    placeholder="Write a reply to the buyer…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        if (!reply.trim()) {
                          toast.error("Write a reply first");
                          return;
                        }
                        toast.success("Reply saved locally");
                        setReply("");
                        markStatus(selected.id, "READ");
                      }}
                    >
                      <MailOpen className="mr-2 h-4 w-4" />
                      Send reply
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setReply(
                          `Habari ${selected.fromName.split(" ")[0]}, thank you for your interest in ${selected.propertyTitle ?? "the property"}. Are you available for a viewing this week?`,
                        );
                      }}
                    >
                      Use template
                    </Button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>Select a message</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
