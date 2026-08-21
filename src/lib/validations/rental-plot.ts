import { z } from "zod";

import { MAX_LISTING_IMAGES } from "@/lib/listing-media";
import { listingCurrencySchema } from "@/lib/currencies";

const plotUnitImageSchema = z.object({
  url: z.string().min(1, "Image URL is required"),
  publicId: z.string().optional().nullable(),
  alt: z.string().max(200).optional().nullable(),
  isPrimary: z.boolean().optional(),
  order: z.coerce.number().int().min(0).optional(),
});

export const UNIT_FLOOR_OPTIONS = [
  "Ground floor",
  "First floor",
  "Second floor",
  "Third floor",
  "Fourth floor",
  "Fifth floor+",
  "Basement",
  "Rooftop",
] as const;

export const createRentalPlotSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  county: z.string().trim().min(2).max(80),
  town: z.string().trim().min(2).max(80),
  estate: z.string().trim().max(120).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const updateRentalPlotSchema = createRentalPlotSchema.partial();

export const createPlotUnitSchema = z.object({
  unitLabel: z.string().trim().min(1).max(60),
  unitFloor: z
    .string()
    .trim()
    .min(2, "Floor is required (e.g. First floor)")
    .max(40),
  title: z.string().trim().min(5).max(160).optional(),
  description: z.string().trim().min(20).max(5000).optional(),
  propertyType: z
    .enum([
      "APARTMENT",
      "HOUSE",
      "TOWNHOUSE",
      "VILLA",
      "STUDIO",
      "BUNGALOW",
      "MAISONETTE",
      "PENTHOUSE",
      "OTHER",
    ])
    .default("APARTMENT"),
  price: z.coerce.number().positive(),
  currency: listingCurrencySchema,
  bedrooms: z.coerce.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional().nullable(),
  furnished: z.boolean().optional().default(false),
  parkingSpaces: z.coerce.number().int().min(0).max(20).optional().default(0),
  images: z
    .array(plotUnitImageSchema)
    .min(1, "Add at least one photo of this house")
    .max(MAX_LISTING_IMAGES, `You can upload up to ${MAX_LISTING_IMAGES} photos`),
  housesAvailable: z.coerce.number().int().min(1).max(80).default(1),
  submitForReview: z.boolean().optional().default(true),
});

export type CreateRentalPlotInput = z.infer<typeof createRentalPlotSchema>;
export type CreatePlotUnitInput = z.infer<typeof createPlotUnitSchema>;

export const updatePlotUnitSchema = createPlotUnitSchema
  .omit({ submitForReview: true })
  .extend({
    description: z.string().trim().max(5000).optional().nullable(),
  });

export type UpdatePlotUnitInput = z.infer<typeof updatePlotUnitSchema>;
