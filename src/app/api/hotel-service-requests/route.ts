import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";
import type { HotelServiceCategoryKey } from "@/lib/hotel-services";
import { assertCanReceiveEventRequest, assertHotelSectionAccess } from "@/lib/hotel-plan-server";

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
  const scopeAll =
    searchParams.get("scope") === "all" && session.user.role === "ADMIN";
  const ownerId = scopeAll ? undefined : ctx.actingOwnerId;

  try {
    const requests = await prisma.hotelServiceRequest.findMany({
      where: {
        ...(ownerId ? { ownerId } : {}),
        ...(category && CATEGORIES.includes(category as (typeof CATEGORIES)[number])
          ? { category: category as (typeof CATEGORIES)[number] }
          : {}),
      },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        package: { select: { id: true, title: true } },
        guest: { select: { id: true, name: true, email: true, phone: true } },
        owner: scopeAll
          ? { select: { name: true, email: true } }
          : undefined,
      },
      orderBy: { createdAt: "desc" },
      take: scopeAll ? 500 : 200,
    });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    console.error("List hotel requests error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load requests. Run database migration if this is a new install." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as {
      ownerId?: string;
      propertyId?: string | null;
      packageId?: string | null;
      category?: HotelServiceCategoryKey;
      contactName?: string;
      contactEmail?: string | null;
      contactPhone?: string | null;
      organization?: string | null;
      eventTitle?: string | null;
      checkIn?: string | null;
      checkOut?: string | null;
      guestCount?: number | null;
      roomCount?: number | null;
      message?: string | null;
    };

    if (!body.ownerId || !body.category || !body.contactName?.trim()) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    if (!CATEGORIES.includes(body.category)) {
      return NextResponse.json({ success: false, error: "Invalid category" }, { status: 400 });
    }

    if (body.category === "EVENT_BOOKING_REQUEST") {
      const eventCheck = await assertCanReceiveEventRequest(body.ownerId);
      if (!eventCheck.ok) {
        return NextResponse.json(
          { success: false, error: eventCheck.error, code: eventCheck.code },
          { status: 403 },
        );
      }
    }

    if (body.category === "GROUP_BOOKING") {
      const groupCheck = await assertHotelSectionAccess(body.ownerId, "GROUP_BOOKING");
      if (!groupCheck.ok) {
        return NextResponse.json(
          { success: false, error: groupCheck.error, code: groupCheck.code },
          { status: 403 },
        );
      }
    }

    const request = await prisma.hotelServiceRequest.create({
      data: {
        ownerId: body.ownerId,
        propertyId: body.propertyId || null,
        packageId: body.packageId || null,
        guestId: session.user.id,
        category: body.category,
        contactName: body.contactName.trim(),
        contactEmail: body.contactEmail?.trim() || null,
        contactPhone: body.contactPhone?.trim() || null,
        organization: body.organization?.trim() || null,
        eventTitle: body.eventTitle?.trim() || null,
        checkIn: body.checkIn ? new Date(body.checkIn) : null,
        checkOut: body.checkOut ? new Date(body.checkOut) : null,
        guestCount: body.guestCount ?? null,
        roomCount: body.roomCount ?? null,
        message: body.message?.trim() || null,
      },
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    console.error("Create hotel request error:", error);
    return NextResponse.json({ success: false, error: "Could not submit request" }, { status: 500 });
  }
}
