"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isCrawlerUserAgent } from "@/lib/crawler";

const SESSION_VISIT_KEY = "yh_site_visits";
const MIN_GAP_MS = 10 * 60 * 1000;
const MAX_VISITS_PER_SESSION = 12;

function shouldRecordVisit(path: string) {
  if (typeof window === "undefined") return false;

  try {
    const raw = sessionStorage.getItem(SESSION_VISIT_KEY);
    const visits = raw
      ? (JSON.parse(raw) as Record<string, number>)
      : ({} as Record<string, number>);

    const now = Date.now();
    const keys = Object.keys(visits);

    if (keys.length >= MAX_VISITS_PER_SESSION && !visits[path]) {
      return false;
    }

    const lastAt = visits[path] ?? 0;
    if (now - lastAt < MIN_GAP_MS) {
      return false;
    }

    visits[path] = now;
    const trimmed = Object.fromEntries(
      Object.entries(visits)
        .sort(([, a], [, b]) => b - a)
        .slice(0, MAX_VISITS_PER_SESSION),
    );
    sessionStorage.setItem(SESSION_VISIT_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return true;
  }
}

export function SiteVisitTracker() {
  const pathname = usePathname();
  const lastSent = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/verify-email") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password") ||
      pathname.startsWith("/sitemap") ||
      isCrawlerUserAgent(
        typeof navigator === "undefined" ? "" : navigator.userAgent,
      )
    ) {
      return;
    }

    const now = Date.now();
    if (
      lastSent.current?.path === pathname &&
      now - lastSent.current.at < MIN_GAP_MS
    ) {
      return;
    }

    if (!shouldRecordVisit(pathname)) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastSent.current = { path: pathname, at: Date.now() };
      void fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || null,
        }),
      }).catch(() => undefined);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
