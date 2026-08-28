"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { PropertyMediaImage } from "@/components/property/property-media-image";
import type { PublicAd, SiteAdPlacement } from "@/lib/ads";
import { cn } from "@/lib/utils";

function isExternalLink(url: string) {
  return /^https?:\/\//i.test(url);
}

function AdCard({
  ad,
  variant,
}: {
  ad: PublicAd;
  variant: "banner" | "sidebar" | "inline";
}) {
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    void fetch(`/api/ads/${ad.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view" }),
    }).catch(() => undefined);
  }, [ad.id]);

  function recordClick() {
    void fetch(`/api/ads/${ad.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "click" }),
    }).catch(() => undefined);
  }

  const media = (
    <div
      className={cn(
        "relative overflow-hidden bg-muted",
        variant === "banner" && "aspect-[16/5] sm:aspect-[21/6]",
        variant === "sidebar" && "aspect-[4/3]",
        variant === "inline" && "aspect-[16/6] sm:aspect-[21/5]",
      )}
    >
      <PropertyMediaImage
        src={ad.imageUrl}
        alt={ad.title}
        fill
        className="object-cover"
        sizes={
          variant === "sidebar"
            ? "288px"
            : "(max-width: 768px) 100vw, 1200px"
        }
      />
    </div>
  );

  const inner = ad.linkUrl ? (
    isExternalLink(ad.linkUrl) ? (
      <a
        href={ad.linkUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={recordClick}
        aria-label={ad.title}
      >
        {media}
      </a>
    ) : (
      <Link href={ad.linkUrl} onClick={recordClick} aria-label={ad.title}>
        {media}
      </Link>
    )
  ) : (
    media
  );

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-sm",
        variant === "inline" && "rounded-xl",
      )}
    >
      {inner}
      <p className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        Advertisement
      </p>
    </aside>
  );
}

export function SiteAdSlot({
  placement,
  variant = "banner",
  className,
}: {
  placement: SiteAdPlacement;
  variant?: "banner" | "sidebar" | "inline";
  className?: string;
}) {
  const [ads, setAds] = useState<PublicAd[]>([]);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/ads?placement=${placement}&take=${variant === "banner" ? 1 : 2}`)
      .then((res) => res.json())
      .then((json) => {
        if (cancelled || !json?.success || !Array.isArray(json.data)) return;
        setAds(json.data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [placement, variant]);

  if (ads.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {ads.map((ad) => (
        <AdCard key={ad.id} ad={ad} variant={variant} />
      ))}
    </div>
  );
}
