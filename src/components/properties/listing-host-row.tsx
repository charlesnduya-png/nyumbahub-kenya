"use client";

import { useEffect, useState } from "react";
import { BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingHostSummary } from "@/types";

interface ListingHostRowProps {
  host: ListingHostSummary | null | undefined;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Short label above the row (e.g. on listing cards) */
  showLabel?: boolean;
}

export function ListingHostRow({
  host,
  className,
  size = "sm",
  showLabel = false,
}: ListingHostRowProps) {
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [host?.image, host?.id]);

  if (!host?.name) return null;

  const avatarSize =
    size === "lg" ? "h-16 w-16" : size === "md" ? "h-11 w-11" : "h-8 w-8";
  const initial = host.name.charAt(0).toUpperCase();
  const showPhoto = Boolean(host.image) && !broken;
  const roleLabel =
    host.agencyName ??
    (host.role === "AGENT" ? "Agent" : "Landlord / owner");

  return (
    <div className={cn(className)}>
      {showLabel ? (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {host.role === "AGENT" ? "Agent" : "Listed by"}
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full border bg-muted",
            avatarSize,
          )}
        >
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar API + data URLs
            <img
              src={host.image ?? undefined}
              alt={host.name}
              className="h-full w-full object-cover"
              onError={() => setBroken(true)}
            />
          ) : (
            <div
              className={cn(
                "flex h-full w-full items-center justify-center font-semibold text-muted-foreground",
                size === "lg" ? "text-xl" : "text-xs",
              )}
            >
              {initial}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={cn(
                "truncate font-medium text-foreground",
                size === "lg"
                  ? "text-base"
                  : size === "md"
                    ? "text-sm"
                    : "text-xs",
              )}
            >
              {host.name}
            </p>
            {host.isVerified ? (
              <Badge
                variant="secondary"
                className="h-5 gap-0.5 px-1.5 text-[10px]"
              >
                <BadgeCheck className="h-3 w-3" />
                Verified
              </Badge>
            ) : null}
          </div>
          <p
            className={cn(
              "truncate text-muted-foreground",
              size === "lg" ? "text-sm" : "text-xs",
            )}
          >
            {roleLabel}
          </p>
        </div>
      </div>
    </div>
  );
}
