import { z } from "zod";

const score = z.coerce.number().int().min(1).max(10);

export const createReviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: score,
  cleanliness: score,
  locationScore: score,
  value: score,
  comfort: score,
  staff: score,
  liked: z.string().trim().max(2000).optional().nullable(),
  disliked: z.string().trim().max(2000).optional().nullable(),
  comment: z.string().trim().max(4000).optional().nullable(),
});

export const hostReplySchema = z.object({
  hostReply: z.string().trim().min(2).max(2000),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
