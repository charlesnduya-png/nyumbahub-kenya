"use client";

import { Link2, Plus, Trash2, Video } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { PropertyVideoPlayer } from "@/components/property/property-video-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_LISTING_VIDEOS } from "@/lib/listing-media";
import { isValidPropertyVideoUrl, parsePropertyVideoUrl } from "@/lib/property-video-url";
import { cn } from "@/lib/utils";

export interface UploadedVideo {
  url: string;
  publicId?: string;
  title?: string;
  thumbnail?: string;
}

interface PropertyVideoUploaderProps {
  value: UploadedVideo[];
  onChange: (videos: UploadedVideo[]) => void;
  maxFiles?: number;
  className?: string;
}

export function PropertyVideoUploader({
  value,
  onChange,
  maxFiles = MAX_LISTING_VIDEOS,
  className,
}: PropertyVideoUploaderProps) {
  const [link, setLink] = React.useState("");
  const [title, setTitle] = React.useState("");

  function addLink() {
    if (value.length >= maxFiles) {
      toast.error(`You can add up to ${maxFiles} videos`);
      return;
    }

    const trimmed = link.trim();
    if (!trimmed) {
      toast.error("Paste a video link first");
      return;
    }

    if (!isValidPropertyVideoUrl(trimmed)) {
      toast.error("Use a valid YouTube, Vimeo, or direct MP4/WebM link");
      return;
    }

    const parsed = parsePropertyVideoUrl(trimmed);
    if (!parsed) return;

    if (value.some((v) => v.url === parsed.url)) {
      toast.error("This video link is already added");
      return;
    }

    onChange([
      ...value,
      {
        url: parsed.url,
        title: title.trim() || undefined,
      },
    ]);

    setLink("");
    setTitle("");
    toast.success("Video link added");
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <Video className="h-4 w-4 text-primary" />
          Add property video by link
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Paste a YouTube, Vimeo, or direct video link (MP4/WebM). Max{" "}
          {maxFiles} videos. No Cloudinary needed.
        </p>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="property-video-link">Video link</Label>
            <Input
              id="property-video-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              disabled={value.length >= maxFiles}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="property-video-title">Title (optional)</Label>
            <Input
              id="property-video-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Walkthrough tour"
              disabled={value.length >= maxFiles}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={value.length >= maxFiles}
            onClick={addLink}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add video link
          </Button>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Tip: upload to YouTube or Google Drive (public link), then paste the
          URL here.
        </p>
      </div>

      {value.length > 0 ? (
        <ul className="space-y-3">
          {value.map((video, index) => (
            <li
              key={`${video.url}-${index}`}
              className="overflow-hidden rounded-xl border bg-muted/20"
            >
              <PropertyVideoPlayer url={video.url} title={video.title} />
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {video.title ?? `Video ${index + 1}`}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {video.url}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => removeAt(index)}
                  aria-label="Remove video"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
