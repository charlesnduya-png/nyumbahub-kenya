import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import { normalizeBlogCoverImage } from "@/lib/blog-cover-image";
import { endOfAdDay, normalizeAdLink, serializeAd } from "@/lib/ads";
import { prisma } from "@/lib/prisma";
import { advertisementUpdateSchema } from "@/lib/validations/ad";

async function requireAdsAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role === "ADMIN" || isSiteOwnerEmail(session.user.email)) {
    return session;
  }
  return null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireAdsAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const existing = await prisma.advertisement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = advertisementUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid ad",
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    let imageUrl = existing.imageUrl;
    if (data.imageUrl !== undefined) {
      const nextImage = normalizeBlogCoverImage(data.imageUrl);
      if (!nextImage || nextImage === "__invalid__") {
        return NextResponse.json(
          { success: false, error: "Upload a valid ad image" },
          { status: 400 },
        );
      }
      imageUrl = nextImage;
    }

    let linkUrl = existing.linkUrl;
    if (data.linkUrl !== undefined) {
      const nextLink = normalizeAdLink(data.linkUrl);
      if (nextLink === "__invalid__") {
        return NextResponse.json(
          { success: false, error: "Link must be a site path or http(s) URL" },
          { status: 400 },
        );
      }
      linkUrl = nextLink;
    }

    const ad = await prisma.advertisement.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        imageUrl,
        linkUrl,
        ...(data.placement !== undefined ? { placement: data.placement } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.startDate !== undefined ? { startDate: data.startDate } : {}),
        ...(data.endDate !== undefined
          ? { endDate: data.endDate ? endOfAdDay(data.endDate) : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: serializeAd(ad) });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not update ad" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireAdsAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const existing = await prisma.advertisement.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 },
      );
    }

    await prisma.advertisement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not delete ad" },
      { status: 500 },
    );
  }
}
