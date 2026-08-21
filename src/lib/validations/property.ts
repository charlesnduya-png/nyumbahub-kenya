import { z } from "zod";

import { MAX_LISTING_IMAGES, MAX_LISTING_VIDEOS } from "@/lib/listing-media";
import { listingCurrencySchema } from "@/lib/currencies";
import { africanCountrySchema } from "@/lib/african-countries";

export const listingTypeSchema = z.enum([
  "BUY",
  "RENT",
  "LAND",
  "COMMERCIAL",
  "HOLIDAY",
]);

export const propertyTypeSchema = z.enum([
  "APARTMENT",
  "HOUSE",
  "TOWNHOUSE",
  "VILLA",
  "STUDIO",
  "BUNGALOW",
  "MAISONETTE",
  "PENTHOUSE",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "PLOT",
  "FARM",
  "OTHER",
]);

/** Empty form inputs become null so optional numbers don't coerce to 0. */
function emptyToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  return value;
}

const optionalInt = z.preprocess(
  emptyToNull,
  z.coerce.number().int().min(0).max(50).nullable().optional(),
);

const optionalPositive = z.preprocess(
  emptyToNull,
  z.coerce.number().positive().nullable().optional(),
);

const optionalYear = z.preprocess(
  emptyToNull,
  z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 2)
    .nullable()
    .optional(),
);

const optionalCoord = (min: number, max: number) =>
  z.preprocess(
    emptyToNull,
    z.coerce.number().min(min).max(max).nullable().optional(),
  );

const amenityFlagsSchema = z.object({
  parking: z.boolean().default(false),
  parkingSpaces: z.coerce.number().int().min(0).max(50).optional(),
  swimmingPool: z.boolean().default(false),
  furnished: z.boolean().default(false),
  security: z.boolean().default(false),
});

const propertyBaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(10000, "Description must be at most 10,000 characters"),
  listingType: listingTypeSchema,
  propertyType: propertyTypeSchema,
  price: z.coerce
    .number()
    .positive("Price must be greater than zero")
    .max(10_000_000_000, "Price is too high"),
  currency: listingCurrencySchema,
  bedrooms: optionalInt,
  bathrooms: optionalInt,
  county: z
    .string()
    .trim()
    .min(2, "County or region is required")
    .max(100, "County name is too long"),
  country: africanCountrySchema,
  town: z
    .string()
    .trim()
    .min(2, "Town is required")
    .max(100, "Town name is too long"),
  estate: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(150, "Estate name is too long").nullable().optional(),
  ),
  parking: z.boolean().default(false),
  parkingSpaces: z.coerce.number().int().min(0).max(50).default(0),
  swimmingPool: z.boolean().default(false),
  furnished: z.boolean().default(false),
  security: z.boolean().default(false),
  floorArea: optionalPositive,
  plotSize: optionalPositive,
  yearBuilt: optionalYear,
  address: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(500).nullable().optional(),
  ),
  latitude: optionalCoord(-90, 90),
  longitude: optionalCoord(-180, 180),
  images: z
    .array(
      z
        .object({
          url: z.string().min(1, "Image URL is required").optional(),
          publicId: z.string().min(1).optional().nullable(),
          alt: z.string().max(200).optional().nullable(),
          isPrimary: z.boolean().optional(),
          order: z.coerce.number().int().min(0).optional(),
        })
        .refine((img) => Boolean(img.url?.trim() || img.publicId?.trim()), {
          message: "Each photo needs an upload reference",
        }),
    )
    .max(MAX_LISTING_IMAGES, `You can upload up to ${MAX_LISTING_IMAGES} photos`)
    .optional()
    .default([]),
  videos: z
    .array(
      z
        .object({
          url: z.string().min(1, "Video URL is required").optional(),
          publicId: z.string().min(1).optional().nullable(),
          title: z.string().max(120).optional().nullable(),
          thumbnail: z.string().optional().nullable(),
        })
        .refine((video) => Boolean(video.url?.trim() || video.publicId?.trim()), {
          message: "Each video needs a link",
        }),
    )
    .max(MAX_LISTING_VIDEOS, `You can upload up to ${MAX_LISTING_VIDEOS} videos`)
    .optional()
    .default([]),
  /** Number of rentable rooms/units in this house (RENT listings). */
  rentalRoomsCount: z.preprocess(
    emptyToNull,
    z.coerce.number().int().min(1).max(40).nullable().optional(),
  ),
  rentalRooms: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        floor: z.string().trim().max(40).optional().nullable(),
        price: z.coerce.number().positive().optional().nullable(),
      }),
    )
    .max(40)
    .optional(),
});

export const createPropertySchema = propertyBaseSchema.superRefine(
  (data, ctx) => {
    if (data.parking && (data.parkingSpaces ?? 0) < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Specify at least one parking space when parking is enabled",
        path: ["parkingSpaces"],
      });
    }
  },
);

export const updatePropertySchema = propertyBaseSchema
  .partial()
  .extend({
    id: z.string().min(1, "Invalid property ID"),
    status: z
      .enum([
        "DRAFT",
        "PENDING",
        "ACTIVE",
        "SOLD",
        "RENTED",
        "EXPIRED",
        "REJECTED",
        "ARCHIVED",
      ])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.parking === true && (data.parkingSpaces ?? 0) < 1) {
      ctx.addIssue({
        code: "custom",
        message: "Specify at least one parking space when parking is enabled",
        path: ["parkingSpaces"],
      });
    }
  });

export const propertySearchSchema = z.object({
  listingType: listingTypeSchema.optional(),
  propertyType: propertyTypeSchema.optional(),
  category: z.enum(["land-plots", "commercial"]).optional(),
  county: z.string().trim().optional(),
  country: z.string().trim().optional(),
  town: z.string().trim().optional(),
  agentId: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  parking: z.coerce.boolean().optional(),
  swimmingPool: z.coerce.boolean().optional(),
  furnished: z.coerce.boolean().optional(),
  security: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export { amenityFlagsSchema };

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
