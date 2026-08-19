import { prisma } from "@/lib/prisma";
import type { BlogPostSummary } from "@/types";

function toSummary(post: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  tags: string[];
  published: boolean;
  publishedAt: Date | null;
  views: number;
  author: { id: string; name: string | null; image: string | null } | null;
}): BlogPostSummary {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    coverImage: post.coverImage,
    category: post.category,
    tags: post.tags ?? [],
    published: post.published,
    publishedAt: post.publishedAt,
    views: post.views,
    author: {
      id: post.author?.id ?? "",
      name: post.author?.name ?? "Your Home Editorial",
      image: post.author?.image ?? null,
    },
  };
}

export async function getPublishedBlogPosts(limit = 20): Promise<BlogPostSummary[]> {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { publishedAt: "desc" },
      take: limit,
    });

    return posts.map(toSummary);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string) {
  try {
    return await prisma.blogPost.findUnique({
      where: { slug },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });
  } catch {
    return null;
  }
}
