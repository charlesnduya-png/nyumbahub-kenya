"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CATEGORIES: { key: ScoreKey; label: string }[] = [
  { key: "rating", label: "Overall" },
  { key: "staff", label: "Host" },
  { key: "cleanliness", label: "Cleanliness" },
  { key: "comfort", label: "Comfort" },
  { key: "value", label: "Value for money" },
  { key: "locationScore", label: "Location" },
];

type ScoreKey =
  | "rating"
  | "staff"
  | "cleanliness"
  | "comfort"
  | "value"
  | "locationScore";

interface GuestReviewFormProps {
  bookingId: string;
  propertyTitle: string;
  onSaved?: () => void;
}

export function GuestReviewForm({
  bookingId,
  propertyTitle,
  onSaved,
}: GuestReviewFormProps) {
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    rating: 8,
    staff: 8,
    cleanliness: 8,
    comfort: 8,
    value: 8,
    locationScore: 8,
  });
  const [liked, setLiked] = useState("");
  const [disliked, setDisliked] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          ...scores,
          liked: liked.trim() || undefined,
          disliked: disliked.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not save review");
        return;
      }
      toast.success("Thanks — your review is live on the listing");
      onSaved?.();
    } catch {
      toast.error("Could not save review");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-4">
      <div>
        <p className="font-medium">Review your stay</p>
        <p className="text-sm text-muted-foreground">{propertyTitle}</p>
      </div>
      {CATEGORIES.map((category) => (
        <fieldset key={category.key} className="space-y-2">
          <Label className="text-sm">{category.label}</Label>
          <div className="flex flex-wrap gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const selected = scores[category.key] === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setScores((prev) => ({ ...prev, [category.key]: n }))
                  }
                  className={`h-8 w-8 rounded-md text-xs font-semibold ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                  aria-pressed={selected}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
      <div className="space-y-1.5">
        <Label htmlFor={`liked-${bookingId}`}>What you liked</Label>
        <Textarea
          id={`liked-${bookingId}`}
          rows={2}
          value={liked}
          onChange={(e) => setLiked(e.target.value)}
          placeholder="The host, the view, the location…"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`disliked-${bookingId}`}>What could be better</Label>
        <Textarea
          id={`disliked-${bookingId}`}
          rows={2}
          value={disliked}
          onChange={(e) => setDisliked(e.target.value)}
          placeholder="Optional"
        />
      </div>
      <Button type="submit" disabled={saving}>
        {saving ? "Publishing…" : "Publish review"}
      </Button>
    </form>
  );
}
