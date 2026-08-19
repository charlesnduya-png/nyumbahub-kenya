"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { compressImageFile } from "@/lib/compress-image";

function uploadedUrl(json: { url?: string; data?: { url?: string } }) {
  return json.data?.url ?? json.url ?? null;
}

export function ProfilePhotoCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { data: session, update: updateSession } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(session?.user?.image ?? null);
  const [name, setName] = useState(session?.user?.name ?? "");
  const [role, setRole] = useState(session?.user?.role ?? "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      const json = await res.json();
      if (!res.ok) return;
      setImage(json.data?.image ?? null);
      setName(json.data?.name ?? "");
      setRole(json.data?.role ?? "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveImage(nextImage: string | null) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: nextImage }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error ?? "Could not save photo");
    }
    setImage(json.data?.image ?? nextImage);
    await updateSession({
      user: {
        name: json.data?.name ?? name,
        image: json.data?.image ?? nextImage,
      },
    });
  }

  async function uploadPhoto(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo must be 8MB or smaller");
      return;
    }

    setBusy(true);
    try {
      const compressed = await compressImageFile(file);
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("type", "profile");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      const url = uploadedUrl(json);

      if (!res.ok || !json.success || !url) {
        toast.error(json.error ?? "Upload failed");
        return;
      }

      await saveImage(url);
      toast.success("Profile photo saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    setBusy(true);
    try {
      await saveImage(null);
      toast.success("Profile photo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove photo");
    } finally {
      setBusy(false);
    }
  }

  const initial = (name || session?.user?.email || "?").charAt(0).toUpperCase();
  const isAgent = role === "AGENT";

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle>Profile photo / logo</CardTitle>
        {compact ? (
          <Button size="sm" variant="outline" asChild>
            <Link href="/dashboard/pro/profile">Edit full profile</Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border bg-muted">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element -- supports data URLs
            <img
              src={image}
              alt={name || "Profile"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-muted-foreground">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : initial}
            </div>
          )}
          {busy ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm text-muted-foreground">
            {isAgent
              ? "Upload your headshot or agency logo. It appears on your public agent page and listings."
              : "Upload a profile photo or logo for your professional account. It appears on your listings."}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadPhoto(file);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              {image ? "Change photo" : "Upload photo"}
            </Button>
            {image ? (
              <Button
                type="button"
                variant="ghost"
                disabled={busy}
                onClick={() => void removePhoto()}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
