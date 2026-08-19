"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  Calendar,
  CreditCard,
  Home,
  Inbox,
  KeyRound,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  isOwnerBookingAlert,
  playOwnerBookingAlertSound,
  unlockNotificationSound,
} from "@/lib/notification-sound";
import { formatRelativeDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/types";

function typeIcon(type: string) {
  switch (type) {
    case "BOOKING":
      return Calendar;
    case "RENTAL_RESERVATION":
      return KeyRound;
    case "MESSAGE":
      return MessageSquare;
    case "LEAD":
      return Inbox;
    case "PAYMENT":
      return CreditCard;
    case "LISTING":
      return Home;
    case "ALERT":
      return ShieldAlert;
    default:
      return Bell;
  }
}

export function NotificationBell({
  className,
  pollMs,
}: {
  className?: string;
  pollMs?: number;
}) {
  const { status, data: session } = useSession();
  const role = session?.user?.role;
  const isOwner = role === "SELLER" || role === "AGENT";
  const effectivePollMs = pollMs ?? (isOwner ? 20_000 : 45_000);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  const load = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/notifications");
      const json = (await res.json()) as {
        success?: boolean;
        data?: { notifications: NotificationItem[]; unreadCount: number };
      };
      if (res.ok && json.success && json.data) {
        const notifications = json.data.notifications;
        const incomingOwnerAlerts = notifications.filter(
          (n) => !n.isRead && isOwnerBookingAlert(n.type, role),
        );
        const newOwnerAlerts = incomingOwnerAlerts.filter(
          (n) => !seenNotificationIdsRef.current.has(n.id),
        );

        for (const n of notifications) {
          seenNotificationIdsRef.current.add(n.id);
        }

        if (!initialLoadRef.current && newOwnerAlerts.length > 0) {
          playOwnerBookingAlertSound();
        }

        initialLoadRef.current = false;
        setItems(notifications);
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // keep previous state
    }
  }, [status, role]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const unlock = () => unlockNotificationSound();
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated") return;
    void load();
    const id = window.setInterval(() => void load(), effectivePollMs);
    return () => window.clearInterval(id);
  }, [status, load, effectivePollMs]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  async function markAllRead() {
    setLoading(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }

  async function openNotification(n: NotificationItem) {
    if (!n.isRead) {
      void fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setItems((prev) =>
        prev.map((item) =>
          item.id === n.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
  }

  if (status !== "authenticated") return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative rounded-full", className)}
          aria-label={
            unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "Notifications"
          }
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,22rem)] p-0">
        <div className="flex items-center justify-between gap-2 px-3 py-2">
          <DropdownMenuLabel className="p-0 text-base">
            Notifications
          </DropdownMenuLabel>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              disabled={loading}
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
          ) : null}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            items.map((n) => {
              const Icon = typeIcon(n.type);
              const content = (
                <div className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      n.isRead ? "bg-muted" : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm leading-snug",
                        !n.isRead && "font-semibold",
                      )}
                    >
                      {n.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {n.body}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatRelativeDate(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
              );

              if (n.link) {
                return (
                  <DropdownMenuItem
                    key={n.id}
                    asChild
                    className="cursor-pointer rounded-none px-3 py-3 focus:bg-accent"
                  >
                    <Link href={n.link} onClick={() => void openNotification(n)}>
                      {content}
                    </Link>
                  </DropdownMenuItem>
                );
              }

              return (
                <DropdownMenuItem
                  key={n.id}
                  className="cursor-pointer rounded-none px-3 py-3 focus:bg-accent"
                  onSelect={() => void openNotification(n)}
                >
                  {content}
                </DropdownMenuItem>
              );
            })
          )}
        </div>
        <DropdownMenuSeparator className="m-0" />
        <div className="p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)}>
              View all notifications
            </Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
