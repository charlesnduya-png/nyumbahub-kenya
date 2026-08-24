"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isCrawlerUserAgent } from "@/lib/crawler";

export function SiteVisitTracker() {
  const pathname = usePathname();
  const lastSent = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (
      !pathname ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/api") ||
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
      now - lastSent.current.at < 30_000
    ) {
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
    }, 300);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}
