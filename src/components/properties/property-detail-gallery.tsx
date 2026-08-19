"use client";

import { useEffect, useState } from "react";

import { PropertyMediaImage } from "@/components/property/property-media-image";
import { PropertyVideoPlayer } from "@/components/property/property-video-player";

type GalleryImage = {
  id: string;
  url: string;
  alt?: string | null;
};

type GalleryVideo = {
  id: string;
  url: string;
  title?: string | null;
  thumbnail?: string | null;
};

interface PropertyDetailGalleryProps {
  slug: string;
  title: string;
  initialImages: GalleryImage[];
  initialVideos?: GalleryVideo[];
}

export function PropertyDetailGallery({
  slug,
  title,
  initialImages,
  initialVideos = [],
}: PropertyDetailGalleryProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [videos, setVideos] = useState<GalleryVideo[]>(initialVideos);

  useEffect(() => {
    if (initialImages.length > 1 && initialVideos.length > 0) return;

    let cancelled = false;

    const loadGallery = () => {
      void fetch(`/api/properties/${encodeURIComponent(slug)}/gallery`)
        .then((res) => res.json())
        .then(
          (json: {
            success?: boolean;
            data?: {
              images?: GalleryImage[];
              videos?: GalleryVideo[];
            };
          }) => {
            if (cancelled || !json.success || !json.data) return;
            if (Array.isArray(json.data.images) && json.data.images.length > 0) {
              setImages(json.data.images);
            }
            if (Array.isArray(json.data.videos)) {
              setVideos(json.data.videos);
            }
          },
        )
        .catch(() => undefined);
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(loadGallery, { timeout: 1500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timer = window.setTimeout(loadGallery, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [slug, initialImages.length, initialVideos.length]);

  if (images.length === 0 && videos.length === 0) {
    return <div className="aspect-[16/9] rounded-lg bg-muted sm:col-span-2" />;
  }

  const hero = images[0];
  const rest = images.slice(1);

  return (
    <div className="space-y-4">
      {images.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-muted sm:col-span-2">
            <PropertyMediaImage
              src={hero.url}
              alt={hero.alt ?? title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          </div>
          {rest.map((img) => (
            <div
              key={img.id}
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted"
            >
              <PropertyMediaImage
                src={img.url}
                alt={img.alt ?? title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ))}
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Property videos</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="overflow-hidden rounded-lg border bg-muted/20"
              >
                <PropertyVideoPlayer url={video.url} title={video.title} />
                {video.title ? (
                  <p className="px-3 py-2 text-sm font-medium">{video.title}</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
