import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { reviewScoreLabel } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { formatRelativeDate } from "@/lib/utils";

export default async function TenantReviewsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const reviews = userId
    ? await prisma.review.findMany({
        where: { userId },
        include: {
          property: {
            select: { title: true, slug: true, town: true, county: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My guest reviews</h1>
        <p className="mt-1 text-muted-foreground">
          Reviews you published after a stay. They appear on the listing for
          other travellers.
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No reviews yet. After checkout, open My Bookings and score your
              stay.
            </p>
            <Button asChild>
              <Link href="/dashboard/tenant/bookings">My bookings</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="space-y-2 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/properties/${review.property.slug}`}
                      className="font-semibold hover:text-primary hover:underline"
                    >
                      {review.property.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {review.property.town}, {review.property.county} ·{" "}
                      {formatRelativeDate(review.createdAt)}
                    </p>
                  </div>
                  <p className="rounded-lg bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground">
                    {review.rating.toFixed(1)} {reviewScoreLabel(review.rating)}
                  </p>
                </div>
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
