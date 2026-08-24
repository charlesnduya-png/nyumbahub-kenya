import { prisma } from "@/lib/prisma";
import { guestDisplayName, reviewScoreLabel } from "@/lib/membership";

const CATEGORY_KEYS = [
  "cleanliness",
  "locationScore",
  "value",
  "comfort",
  "staff",
] as const;

export async function getPropertyReviews(propertyId: string) {
  const reviews = await prisma.review.findMany({
    where: { propertyId },
    include: {
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  const scores = reviews.map((r) => r.rating).filter((n) => n > 0);
  const average =
    scores.length > 0
      ? Math.round((scores.reduce((sum, n) => sum + n, 0) / scores.length) * 10) /
        10
      : 0;

  function avg(key: (typeof CATEGORY_KEYS)[number]) {
    const values = reviews.map((r) => r[key]).filter((n) => n > 0);
    if (values.length === 0) return 0;
    return Math.round((values.reduce((sum, n) => sum + n, 0) / values.length) * 10) / 10;
  }

  return {
    average,
    count: reviews.length,
    label: reviewScoreLabel(average),
    categories: {
      cleanliness: avg("cleanliness"),
      location: avg("locationScore"),
      value: avg("value"),
      comfort: avg("comfort"),
      staff: avg("staff"),
    },
    items: reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      cleanliness: review.cleanliness,
      locationScore: review.locationScore,
      value: review.value,
      comfort: review.comfort,
      staff: review.staff,
      liked: review.liked,
      disliked: review.disliked,
      comment: review.comment,
      hostReply: review.hostReply,
      createdAt: review.createdAt,
      guestName: guestDisplayName(review.user.name),
    })),
  };
}

export type PropertyReviewsData = Awaited<ReturnType<typeof getPropertyReviews>>;
