"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface ShareListingButtonProps {
  title: string;
  url: string;
  className?: string;
}

export function ShareListingButton({
  title,
  url,
  className,
}: ShareListingButtonProps) {
  const [busy, setBusy] = useState(false);

  async function share() {
    if (busy) return;
    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title,
          text: `Check out ${title} on Your Home`,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(url);
      toast.success("Listing link copied");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Listing link copied");
      } catch {
        toast.error("Could not share this listing");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={() => void share()}
      disabled={busy}
    >
      <Share2 className="mr-1 h-4 w-4" />
      Share
    </Button>
  );
}
