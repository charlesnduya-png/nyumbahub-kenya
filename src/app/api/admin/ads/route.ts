import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import { normalizeBlogCoverImage } from "@/lib/blog-cover-image";
import { endOfAdDay, normalizeAdLink, serializeAd } from "@/lib/ads";
import { prisma } from "@/lib/prisma";
import { advertisementSchema } from "@/lib/validations/ad";

async function requireAdsAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  if (session.user.role === "ADMIN" || isSiteOwnerEmail(session.user.email)) {
    return session;
  }
  return null;
}

export async function GET() {
  try {
    const session = await requireAdsAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const ads = await prisma.advertisement.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      data: ads.map(serializeAd),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not load ads" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdsAdmin();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = advertisementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid ad",
        },
        { status: 400 },
      );
    }

    const imageUrl = normalizeBlogCoverImage(parsed.data.imageUrl);
    if (!imageUrl || imageUrl === "__invalid__") {
      return NextResponse.json(
        { success: false, error: "Upload a valid ad image" },
        { status: 400 },
      );
    }

    const linkUrl = normalizeAdLink(parsed.data.linkUrl);
    if (linkUrl === "__invalid__") {
      return NextResponse.json(
        { success: false, error: "Link must be a site path or http(s) URL" },
        { status: 400 },
      );
    }

    const ad = await prisma.advertisement.create({
      data: {
        title: parsed.data.title,
        imageUrl,
        linkUrl,
        placement: parsed.data.placement,
        isActive: parsed.data.isActive ?? true,
        startDate: parsed.data.startDate ?? null,
        endDate: parsed.data.endDate ? endOfAdDay(parsed.data.endDate) : null,
        advertiserId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: serializeAd(ad) });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not create ad" },
      { status: 500 },
    );
  }
}
