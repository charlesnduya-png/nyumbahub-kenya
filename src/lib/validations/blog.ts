import { z } from "zod";

export const BLOG_CATEGORIES = [
  "Market Insights",
  "Buying Guide",
  "Renting Tips",
  "Legal & Title",
  "Investment",
] as const;

export const blogPostSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(200)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens")
    .optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(20, "Content must be at least 20 characters"),
  coverImage: z.string().optional().nullable(),
  category: z.enum(BLOG_CATEGORIES),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  published: z.boolean().optional(),
});

export type BlogPostInput = z.infer<typeof blogPostSchema>;

export const blogPostUpdateSchema = blogPostSchema.partial();

export type BlogPostUpdateInput = z.infer<typeof blogPostUpdateSchema>;
