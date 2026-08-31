import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";
import type { HotelServiceCategoryKey } from "@/lib/hotel-services";
import {
  assertCanCreateHotelPackage,
  assertHotelSectionAccess,
} from "@/lib/hotel-plan-server";

const CATEGORIES = [
  "GROUP_BOOKING",
  "EVENT_CONFERENCE",
  "EVENT_BOOKING_REQUEST",
  "SPORTS_TEAM",
  "COOPERATIVE",
  "HOTEL_OFFER",
] as const;

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const canView =
    session.user.role === "ADMIN" ||
    canViewWith(ctx, "manageListings") ||
    canViewWith(ctx, "manageBookings");

  if (!canView) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category")?.toUpperCase();
  const ownerId = ctx.actingOwnerId;

  try {
    const packages = await prisma.hotelPackage.findMany({
      where: {
        ownerId,
        ...(category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])
          ? { category: category as (typeof CATEGORIES)[number] }
          : {}),
      },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        _count: { select: { requests: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ success: true, data: packages });
  } catch (error) {
    console.error("List hotel packages error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load packages. Run database migration if this is a new install." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!canViewWith(ctx, "manageListings") && session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      category?: HotelServiceCategoryKey;
      title?: string;
      description?: string;
      propertyId?: string | null;
      minGuests?: number | null;
      maxGuests?: number | null;
      minRooms?: number | null;
      priceFrom?: number | null;
      priceTo?: number | null;
      currency?: string;
      validFrom?: string | null;
      validUntil?: string | null;
      terms?: string | null;
    };

    if (!body.category || !CATEGORIES.includes(body.category)) {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
    }
    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json({ success: false, error: "Title and description required" }, { status: 400 });
    }

    const sectionCheck = await assertHotelSectionAccess(ctx.actingOwnerId, body.category);
    if (!sectionCheck.ok) {
      return NextResponse.json(
        { success: false, error: sectionCheck.error, code: sectionCheck.code },
        { status: 403 },
      );
    }

    const packageCheck = await assertCanCreateHotelPackage(ctx.actingOwnerId);
    if (!packageCheck.ok) {
      return NextResponse.json(
        { success: false, error: packageCheck.error, code: packageCheck.code },
        { status: 403 },
      );
    }

    const pkg = await prisma.hotelPackage.create({
      data: {
        ownerId: ctx.actingOwnerId,
        category: body.category,
        title: body.title.trim(),
        description: body.description.trim(),
        propertyId: body.propertyId || null,
        minGuests: body.minGuests ?? null,
        maxGuests: body.maxGuests ?? null,
        minRooms: body.minRooms ?? null,
        priceFrom: body.priceFrom ?? null,
        priceTo: body.priceTo ?? null,
        currency: body.currency || "KES",
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        terms: body.terms?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    console.error("Create hotel package error:", error);
    return NextResponse.json({ success: false, error: "Could not create package" }, { status: 500 });
  }
}
