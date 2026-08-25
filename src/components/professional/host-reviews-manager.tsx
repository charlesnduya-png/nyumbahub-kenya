"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { reviewScoreLabel } from "@/lib/membership";
import { formatRelativeDate } from "@/lib/utils";
import type { ListingType } from "@/types";

type HostReview = {
  id: string;
  rating: number;
  cleanliness: number;
  locationScore: number;
  value: number;
  comfort: number;
  staff: number;
  liked?: string | null;
  disliked?: string | null;
  comment?: string | null;
  hostReply?: string | null;
  createdAt: string;
  guestName: string;
  property: {
    title: string;
    slug: string;
    town: string;
    county: string;
  };
};

export function HostReviewsManager({
  listingType,
  title,
  subtitle,
  emptyHint,
  hideHeader = false,
}: {
  listingType?: Extract<ListingType, "HOLIDAY" | "HOTEL">;
  title?: string;
  subtitle?: string;
  emptyHint: string;
  hideHeader?: boolean;
}) {
  const [reviews, setReviews] = useState<HostReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ host: "1" });
      if (listingType) params.set("listingType", listingType);
      const res = await fetch(`/api/reviews?${params.toString()}`);
      const json = (await res.json()) as {
        success?: boolean;
        data?: HostReview[];
        error?: string;
      };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load reviews");
        return;
      }
      setReviews(json.data ?? []);
    } catch {
      toast.error("Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [listingType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveReply(id: string) {
    const hostReply = (drafts[id] ?? "").trim();
    if (hostReply.length < 2) {
      toast.error("Enter a short reply");
      return;
    }
    setSavingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostReply }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not save reply");
        return;
      }
      toast.success("Reply published");
      setDrafts((prev) => ({ ...prev, [id]: "" }));
      await load();
    } catch {
      toast.error("Could not save reply");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {hideHeader || !title ? null : (
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {emptyHint}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/properties/${review.property.slug}`}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {review.property.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {review.guestName} · {review.property.town},{" "}
                      {review.property.county} ·{" "}
                      {formatRelativeDate(review.createdAt)}
                    </p>
                  </div>
                  <p className="rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
                    {review.rating.toFixed(1)} {reviewScoreLabel(review.rating)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cleanliness {review.cleanliness} · Location{" "}
                  {review.locationScore} · Value {review.value} · Comfort{" "}
                  {review.comfort} · Staff {review.staff}
                </p>
                {review.liked ? (
                  <p className="text-sm">
                    <span className="font-medium">Liked: </span>
                    {review.liked}
                  </p>
                ) : null}
                {review.disliked ? (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Could improve:{" "}
                    </span>
                    {review.disliked}
                  </p>
                ) : null}
                {review.comment ? (
                  <p className="text-sm">{review.comment}</p>
                ) : null}
                {review.hostReply ? (
                  <p className="rounded-lg bg-muted/50 p-3 text-sm">
                    <span className="font-medium">Your reply: </span>
                    {review.hostReply}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Reply as the hotel…"
                      value={drafts[review.id] ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [review.id]: e.target.value,
                        }))
                      }
                    />
                    <Button
                      size="sm"
                      disabled={savingId === review.id}
                      onClick={() => void saveReply(review.id)}
                    >
                      Publish reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
