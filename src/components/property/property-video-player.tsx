"use client";

import { parsePropertyVideoUrl } from "@/lib/property-video-url";
import { cn } from "@/lib/utils";

interface PropertyVideoPlayerProps {
  url: string;
  title?: string | null;
  className?: string;
}

export function PropertyVideoPlayer({
  url,
  title,
  className,
}: PropertyVideoPlayerProps) {
  const parsed = parsePropertyVideoUrl(url);

  if (!parsed) {
    return (
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground",
          className,
        )}
      >
        Video unavailable
      </div>
    );
  }

  if (parsed.kind === "youtube" || parsed.kind === "vimeo") {
    return (
      <div className={cn("aspect-video overflow-hidden rounded-lg bg-black", className)}>
        <iframe
          src={parsed.embedUrl}
          title={title ?? "Property video"}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <video
      src={parsed.embedUrl}
      controls
      playsInline
      preload="metadata"
      className={cn("aspect-video w-full rounded-lg bg-black object-contain", className)}
    />
  );
}
