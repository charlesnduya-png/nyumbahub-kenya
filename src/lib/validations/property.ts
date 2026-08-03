import { z } from "zod";

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
  bedrooms: z.coerce.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.coerce.number().int().min(0).max(50).optional().nullable(),
  county: z
    .string()
    .trim()
    .min(2, "County is required")
    .max(100, "County name is too long"),
  town: z
    .string()
    .trim()
    .min(2, "Town is required")
    .max(100, "Town name is too long"),
  estate: z
    .string()
    .trim()
    .max(150, "Estate name is too long")
    .optional()
    .nullable(),
  parking: z.boolean().default(false),
  parkingSpaces: z.coerce.number().int().min(0).max(50).default(0),
  swimmingPool: z.boolean().default(false),
  furnished: z.boolean().default(false),
  security: z.boolean().default(false),
  floorArea: z.coerce.number().positive().optional().nullable(),
  plotSize: z.coerce.number().positive().optional().nullable(),
  yearBuilt: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear() + 2)
    .optional()
    .nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  images: z
    .array(
      z.object({
        url: z.string().min(1, "Image URL is required"),
        publicId: z.string().optional().nullable(),
        alt: z.string().max(200).optional().nullable(),
        isPrimary: z.boolean().optional(),
        order: z.coerce.number().int().min(0).optional(),
      }),
    )
    .max(12, "You can upload up to 12 photos")
    .optional()
    .default([]),
});

export const createPropertySchema = propertyBaseSchema.superRefine((data, ctx) => {
  if (data.parking && (data.parkingSpaces ?? 0) < 1) {
    ctx.addIssue({
      code: "custom",
      message: "Specify at least one parking space when parking is enabled",
      path: ["parkingSpaces"],
    });
  }
});

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
  county: z.string().trim().optional(),
  town: z.string().trim().optional(),
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
