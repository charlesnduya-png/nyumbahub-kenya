import { NextResponse } from "next/server";

import { normalizeBlogCoverImage } from "@/lib/blog-cover-image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { blogPostSchema } from "@/lib/validations/blog";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const posts = await prisma.blogPost.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: posts.map((post) => ({
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
        author: post.author,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load blog posts" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = blogPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const baseSlug = data.slug?.trim() || slugify(data.title);
    let slug = baseSlug;
    let suffix = 1;

    while (await prisma.blogPost.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const published = data.published ?? false;
    const coverImage = normalizeBlogCoverImage(data.coverImage);
    if (coverImage === "__invalid__") {
      return NextResponse.json(
        { success: false, error: "Cover image could not be saved. Upload again." },
        { status: 400 },
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title: data.title.trim(),
        slug,
        excerpt: data.excerpt?.trim() || null,
        content: data.content.trim(),
        coverImage,
        category: data.category,
        tags: data.tags ?? [],
        published,
        publishedAt: published ? new Date() : null,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
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
        author: post.author,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not create blog post" },
      { status: 500 },
    );
  }
}
