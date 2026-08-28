import { z } from "zod";

import { AD_PLACEMENTS } from "@/lib/ads";

export const advertisementSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title is too long"),
  imageUrl: z.string().trim().min(1, "Upload an ad image"),
  linkUrl: z.string().trim().max(500).optional().nullable(),
  placement: z.enum(AD_PLACEMENTS),
  isActive: z.boolean().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
});

export const advertisementUpdateSchema = advertisementSchema.partial();

export type AdvertisementInput = z.infer<typeof advertisementSchema>;
