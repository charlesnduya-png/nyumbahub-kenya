import { BlogManager } from "@/components/admin/blog-manager";
import { prisma } from "@/lib/prisma";

export default async function AdminBlogPage() {
  let initialPosts: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    coverImage: string | null;
    category: string;
    tags: string[];
    published: boolean;
    publishedAt: string | null;
    views: number;
    updatedAt: string;
  }> = [];

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    initialPosts = posts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage,
      category: post.category,
      tags: post.tags,
      published: post.published,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      views: post.views,
      updatedAt: post.updatedAt.toISOString(),
    }));
  } catch {
    // Admin UI loads via API when DB unavailable
  }

  return <BlogManager initialPosts={initialPosts} />;
}
