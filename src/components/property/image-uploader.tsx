"use client";

import { ImagePlus, Loader2, Star, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { compressImageFile } from "@/lib/compress-image";
import { MAX_LISTING_IMAGES } from "@/lib/listing-media";
import { cn } from "@/lib/utils";

export interface UploadedImage {
  url: string;
  publicId?: string;
  alt?: string;
  isPrimary?: boolean;
}

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  className?: string;
}

const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_BYTES = 8 * 1024 * 1024;

export function ImageUploader({
  value,
  onChange,
  maxFiles = MAX_LISTING_IMAGES,
  className,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${maxFiles} photos`);
      return;
    }

    const selected = list.slice(0, remaining);
    setUploading(true);

    try {
      const uploaded: UploadedImage[] = [];

      for (const file of selected) {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
          continue;
        }
        if (file.size > MAX_BYTES) {
          toast.error(`${file.name} is larger than 8MB`);
          continue;
        }

        const compressed = await compressImageFile(file);
        const formData = new FormData();
        formData.append("file", compressed);
        formData.append("type", "image");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const json = await res.json();

        if (!res.ok || !json.success) {
          toast.error(json.error ?? `Failed to upload ${file.name}`);
          continue;
        }

        uploaded.push({
          url: json.data.url as string,
          publicId: json.data.publicId as string | undefined,
          alt: file.name.replace(/\.[^.]+$/, ""),
        });

        if (json.stub && uploaded.length === 1) {
          toast.message("Photos saved without Cloudinary", {
            description:
              "Add Cloudinary env vars for reliable image hosting in production.",
          });
        }
      }

      if (uploaded.length > 0) {
        const next = [...value, ...uploaded];
        if (!next.some((img) => img.isPrimary)) {
          next[0] = { ...next[0], isPrimary: true };
        }
        onChange(next);
        toast.success(
          uploaded.length === 1
            ? "Photo uploaded"
            : `${uploaded.length} photos uploaded`,
        );
      }
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    const next = value.filter((_, i) => i !== index);
    if (next.length > 0 && !next.some((img) => img.isPrimary)) {
      next[0] = { ...next[0], isPrimary: true };
    }
    onChange(next);
  }

  function setPrimary(index: number) {
    onChange(
      value.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      })),
    );
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      void uploadFiles(e.dataTransfer.files);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border border-dashed px-4 py-8 text-center transition",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/40",
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImagePlus className="h-5 w-5" />
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          Drag photos here, or browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          JPG, PNG, or WebP · up to 8MB each · max {maxFiles} photos
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          disabled={uploading || value.length >= maxFiles}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Uploading…" : "Choose photos"}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) void uploadFiles(e.target.files);
          }}
        />
      </div>

      {value.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((img, index) => (
            <li
              key={`${img.publicId ?? img.url}-${index}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- supports data URLs in demo mode */}
              <img
                src={img.url}
                alt={img.alt ?? `Property photo ${index + 1}`}
                className="h-full w-full object-cover"
              />
              {img.isPrimary ? (
                <span className="absolute left-2 top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Cover
                </span>
              ) : null}
              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                {!img.isPrimary ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 flex-1 px-2 text-xs"
                    onClick={() => setPrimary(index)}
                  >
                    <Star className="mr-1 h-3 w-3" />
                    Cover
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  className="h-7 px-2"
                  onClick={() => removeAt(index)}
                  aria-label="Remove photo"
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
