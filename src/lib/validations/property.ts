import { z } from "zod";

import { MAX_LISTING_IMAGES, MAX_LISTING_VIDEOS } from "@/lib/listing-media";
import {
  DEFAULT_LISTING_CURRENCY,
  LISTING_CURRENCY_CODES,
  listingCurrencySchema,
} from "@/lib/currencies";
import {
  AFRICAN_COUNTRY_NAMES,
  DEFAULT_LISTING_COUNTRY,
  africanCountrySchema,
} from "@/lib/african-countries";
import { LISTING_FEATURE_SLUGS } from "@/lib/listing-features";

export const listingTypeSchema = z.enum([
  "BUY",
  "RENT",
  "LAND",
  "COMMERCIAL",
  "HOLIDAY",
  "HOTEL",
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
  "HOTEL",
  "OTHER",
]);

/** Empty form inputs become null so optional numbers don't coerce to 0. */
function emptyToNull(value: unknown) {
  if (value === "" || value === undefined || value === null) return null;
  return value;
}

/** Like emptyToNull, but leave missing keys undefined so PATCH does not overwrite them. */
function emptyToNullKeepMissing(value: unknown) {
  if (value === undefined) return undefined;
  if (value === "" || value === null) return null;
  return value;
}

const optionalInt = z.preprocess(
  emptyToNull,
  z.coerce.number().int().min(0).max(50).nullable().optional(),
);

const optionalIntPatch = z.preprocess(
  emptyToNullKeepMissing,
  z.coerce.number().int().min(0).max(50).nullable().optional(),
);

const optionalPositive = z.preprocess(
  emptyToNull,
  z.coerce.number().positive().nullable().optional(),
);

const optionalPositivePatch = z.preprocess(
  emptyToNullKeepMissing,
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

const optionalYearPatch = z.preprocess(
  emptyToNullKeepMissing,
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

const optionalCoordPatch = (min: number, max: number) =>
  z.preprocess(
    emptyToNullKeepMissing,
    z.coerce.number().min(min).max(max).nullable().optional(),
  );

const amenityFlagsSchema = z.object({
  parking: z.boolean().default(false),
  parkingSpaces: z.coerce.number().int().min(0).max(50).optional(),
  swimmingPool: z.boolean().default(false),
  furnished: z.boolean().default(false),
  security: z.boolean().default(false),
});

const propertyImageInputSchema = z
  .object({
    url: z.string().min(1, "Image URL is required").optional(),
    publicId: z.string().min(1).optional().nullable(),
    alt: z.string().max(200).optional().nullable(),
    isPrimary: z.boolean().optional(),
    order: z.coerce.number().int().min(0).optional(),
  })
  .refine((img) => Boolean(img.url?.trim() || img.publicId?.trim()), {
    message: "Each photo needs an upload reference",
  });

const propertyVideoInputSchema = z
  .object({
    url: z.string().min(1, "Video URL is required").optional(),
    publicId: z.string().min(1).optional().nullable(),
    title: z.string().max(120).optional().nullable(),
    thumbnail: z.string().optional().nullable(),
  })
  .refine((video) => Boolean(video.url?.trim() || video.publicId?.trim()), {
    message: "Each video needs a link",
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
  features: z
    .array(z.enum(LISTING_FEATURE_SLUGS))
    .max(60)
    .optional()
    .default([]),
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
    .array(propertyImageInputSchema)
    .max(MAX_LISTING_IMAGES, `You can upload up to ${MAX_LISTING_IMAGES} photos`)
    .optional()
    .default([]),
  videos: z
    .array(propertyVideoInputSchema)
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

/**
 * PATCH must not invent missing fields. Zod `.partial()` keeps `.default()`,
 * which was wiping photos/features/parking on every partial update.
 */
export const updatePropertySchema = z
  .object({
    id: z.string().min(1, "Invalid property ID"),
    title: propertyBaseSchema.shape.title.optional(),
    description: propertyBaseSchema.shape.description.optional(),
    listingType: listingTypeSchema.optional(),
    propertyType: propertyTypeSchema.optional(),
    price: propertyBaseSchema.shape.price.optional(),
    currency: z.enum(LISTING_CURRENCY_CODES).optional(),
    bedrooms: optionalIntPatch,
    bathrooms: optionalIntPatch,
    county: propertyBaseSchema.shape.county.optional(),
    country: z.enum(AFRICAN_COUNTRY_NAMES).optional(),
    town: propertyBaseSchema.shape.town.optional(),
    estate: propertyBaseSchema.shape.estate.optional(),
    parking: z.boolean().optional(),
    parkingSpaces: z.coerce.number().int().min(0).max(50).optional(),
    swimmingPool: z.boolean().optional(),
    furnished: z.boolean().optional(),
    security: z.boolean().optional(),
    features: z.array(z.enum(LISTING_FEATURE_SLUGS)).max(60).optional(),
    floorArea: optionalPositivePatch,
    plotSize: optionalPositivePatch,
    yearBuilt: optionalYearPatch,
    address: propertyBaseSchema.shape.address.optional(),
    latitude: optionalCoordPatch(-90, 90),
    longitude: optionalCoordPatch(-180, 180),
    images: z
      .array(propertyImageInputSchema)
      .max(MAX_LISTING_IMAGES, `You can upload up to ${MAX_LISTING_IMAGES} photos`)
      .optional(),
    videos: z
      .array(propertyVideoInputSchema)
      .max(MAX_LISTING_VIDEOS, `You can upload up to ${MAX_LISTING_VIDEOS} videos`)
      .optional(),
    rentalRoomsCount: z.preprocess(
      emptyToNullKeepMissing,
      z.coerce.number().int().min(1).max(40).nullable().optional(),
    ),
    rentalRooms: propertyBaseSchema.shape.rentalRooms.optional(),
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

export { amenityFlagsSchema, DEFAULT_LISTING_COUNTRY, DEFAULT_LISTING_CURRENCY };

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertySearchInput = z.infer<typeof propertySearchSchema>;
export type ListingType = z.infer<typeof listingTypeSchema>;
export type PropertyType = z.infer<typeof propertyTypeSchema>;
