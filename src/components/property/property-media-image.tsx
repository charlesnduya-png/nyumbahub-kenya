"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const FALLBACK =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80";

function isRemoteHttp(url: string) {
  return /^https?:\/\//i.test(url);
}

function isInlineData(url: string) {
  return url.startsWith("data:") || url.startsWith("blob:");
}

interface PropertyMediaImageProps {
  src?: string | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Renders listing photos safely:
 * - https URLs → next/image
 * - data:/blob: URLs and local /api/media paths → native <img>
 */
export function PropertyMediaImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  sizes,
  priority = false,
}: PropertyMediaImageProps) {
  const initial = src && src.trim().length > 0 ? src : FALLBACK;
  const [current, setCurrent] = useState(initial);

  useEffect(() => {
    setCurrent(src && src.trim().length > 0 ? src : FALLBACK);
  }, [src]);

  if (isInlineData(current) || !isRemoteHttp(current)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={current}
        alt={alt}
        className={cn(
          fill && "absolute inset-0 h-full w-full object-cover",
          className,
        )}
        onError={() => setCurrent(FALLBACK)}
      />
    );
  }

  return (
    <Image
      src={current}
      alt={alt}
      fill={fill}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setCurrent(FALLBACK)}
    />
  );
}
