import { reviewScoreLabel } from "@/lib/membership";
import { formatRelativeDate } from "@/lib/utils";
import type { PropertyReviewsData } from "@/lib/reviews";
import { Progress } from "@/components/ui/progress";

const CATEGORY_LABELS: { key: keyof PropertyReviewsData["categories"]; label: string }[] =
  [
    { key: "staff", label: "Host" },
    { key: "cleanliness", label: "Cleanliness" },
    { key: "comfort", label: "Comfort" },
    { key: "value", label: "Value for money" },
    { key: "location", label: "Location" },
  ];

export function PropertyReviews({
  reviews,
}: {
  reviews: PropertyReviewsData;
}) {
  if (reviews.count === 0) {
    return (
      <section className="rounded-2xl border bg-card p-6">
        <h2 className="font-display text-xl font-semibold">Guest reviews</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No guest reviews yet. Book a stay, then share your experience like on
          Booking.com.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-2xl border bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold">Guest reviews</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {reviews.count} verified guest{reviews.count === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          <p className="text-3xl font-bold tabular-nums">{reviews.average.toFixed(1)}</p>
          <div>
            <p className="font-semibold">{reviews.label}</p>
            <p className="text-xs text-primary-foreground/80">out of 10</p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CATEGORY_LABELS.map((item) => {
          const score = reviews.categories[item.key];
          return (
            <div key={item.key}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.label}</span>
                <span className="font-medium tabular-nums">
                  {score > 0 ? score.toFixed(1) : "—"}
                </span>
              </div>
              <Progress value={score * 10} />
            </div>
          );
        })}
      </div>

      <ul className="space-y-4">
        {reviews.items.map((review) => (
          <li key={review.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{review.guestName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatRelativeDate(review.createdAt)}
                </p>
              </div>
              <div className="rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
                {review.rating.toFixed(1)}
                <span className="ml-1 text-xs font-normal opacity-80">
                  {reviewScoreLabel(review.rating)}
                </span>
              </div>
            </div>
            {review.liked ? (
              <p className="mt-3 text-sm">
                <span className="font-medium">Liked: </span>
                {review.liked}
              </p>
            ) : null}
            {review.disliked ? (
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Could improve: </span>
                {review.disliked}
              </p>
            ) : null}
            {review.comment ? (
              <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
            ) : null}
            {review.hostReply ? (
              <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm">
                <span className="font-medium">Host reply: </span>
                {review.hostReply}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
