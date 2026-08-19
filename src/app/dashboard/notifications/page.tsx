"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils";
import type { NotificationItem } from "@/types";

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { notifications: NotificationItem[]; unreadCount: number };
        error?: string;
      };
      if (!res.ok || !json.success || !json.data) {
        toast.error(json.error ?? "Could not load notifications");
        return;
      }
      setItems(json.data.notifications);
      setUnreadCount(json.data.unreadCount);
    } catch {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  }

  async function markOne(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            Booking updates, listing reviews, and account alerts.
          </p>
        </div>
        {unreadCount > 0 ? (
          <Button variant="outline" onClick={() => void markAllRead()}>
            Mark all as read ({unreadCount})
          </Button>
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              You&apos;re all caught up — no notifications yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((n) => {
            const body = (
              <Card
                className={
                  n.isRead ? "opacity-90" : "border-primary/30 bg-primary/5"
                }
              >
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{n.title}</p>
                      {!n.isRead ? <Badge>New</Badge> : null}
                      <Badge variant="outline">{n.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{n.body}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeDate(n.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );

            if (n.link) {
              return (
                <Link
                  key={n.id}
                  href={n.link}
                  onClick={() => {
                    if (!n.isRead) void markOne(n.id);
                  }}
                  className="block transition hover:opacity-95"
                >
                  {body}
                </Link>
              );
            }

            return (
              <button
                key={n.id}
                type="button"
                className="block w-full text-left"
                onClick={() => {
                  if (!n.isRead) void markOne(n.id);
                }}
              >
                {body}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
