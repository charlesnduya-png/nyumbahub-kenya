import { NextResponse } from "next/server";

import { normalizeBlogCoverImage } from "@/lib/blog-cover-image";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { blogPostUpdateSchema } from "@/lib/validations/blog";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = blogPostUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    let slug = existing.slug;

    if (data.coverImage !== undefined) {
      const coverImage = normalizeBlogCoverImage(data.coverImage);
      if (coverImage === "__invalid__") {
        return NextResponse.json(
          { success: false, error: "Cover image could not be saved. Upload again." },
          { status: 400 },
        );
      }
      data.coverImage = coverImage;
    }

    if (data.slug && data.slug !== existing.slug) {
      const baseSlug = data.slug.trim();
      slug = baseSlug;
      let suffix = 1;
      while (true) {
        const conflict = await prisma.blogPost.findUnique({ where: { slug } });
        if (!conflict || conflict.id === id) break;
        slug = `${baseSlug}-${suffix++}`;
      }
    } else if (data.title && !data.slug) {
      const baseSlug = slugify(data.title);
      if (baseSlug !== existing.slug) {
        slug = baseSlug;
        let suffix = 1;
        while (true) {
          const conflict = await prisma.blogPost.findUnique({ where: { slug } });
          if (!conflict || conflict.id === id) break;
          slug = `${baseSlug}-${suffix++}`;
        }
      }
    }

    const nextPublished =
      data.published !== undefined ? data.published : existing.published;
    let publishedAt = existing.publishedAt;
    if (nextPublished && !existing.published) {
      publishedAt = new Date();
    } else if (!nextPublished) {
      publishedAt = null;
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        slug,
        ...(data.excerpt !== undefined
          ? { excerpt: data.excerpt?.trim() || null }
          : {}),
        ...(data.content !== undefined ? { content: data.content.trim() } : {}),
        ...(data.coverImage !== undefined
          ? { coverImage: data.coverImage }
          : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.tags !== undefined ? { tags: data.tags } : {}),
        published: nextPublished,
        publishedAt,
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
      { success: false, error: "Could not update blog post" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Blog post not found" },
        { status: 404 },
      );
    }

    await prisma.blogPost.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not delete blog post" },
      { status: 500 },
    );
  }
}
