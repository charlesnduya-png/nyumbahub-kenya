import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createBookingSchema,
  nightsBetween,
} from "@/lib/validations/booking";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";
import { isStayListing, stayLabel } from "@/lib/listing-kinds";
import { isSiteOwnerEmail } from "@/lib/site-owner";

function inboxPathForRole(role: string, peerId: string, propertyId: string) {
  const params = new URLSearchParams({ peer: peerId, property: propertyId });
  if (role === "BUYER") {
    return `/dashboard/tenant/messages?${params.toString()}`;
  }
  return `/dashboard/pro/inbox?${params.toString()}`;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const listingTypeParam = new URL(request.url).searchParams.get("listingType");
  const listingType =
    listingTypeParam === "HOTEL" || listingTypeParam === "HOLIDAY"
      ? (listingTypeParam as "HOTEL" | "HOLIDAY")
      : undefined;

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const isAdmin =
    session.user.role === "ADMIN" || isSiteOwnerEmail(session.user.email);
  const canHostBookings =
    isAdmin || canViewWith(ctx, "manageBookings");

  const hostUserId = ctx.actingOwnerId;
  const guestUserId = session.user.id;

  try {
    if (canHostBookings) {
      const bookings = await prisma.booking.findMany({
        where: {
          property: {
            ...(listingType ? { listingType } : {}),
            ...(isAdmin
              ? {}
              : {
                  OR: [
                    { ownerId: hostUserId },
                    { agent: { userId: hostUserId } },
                  ],
                }),
          },
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              town: true,
              county: true,
              price: true,
              currency: true,
              listingType: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          guest: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({ success: true, data: bookings, view: "owner" });
    }

    const bookings = await prisma.booking.findMany({
      where: { guestId: guestUserId },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              town: true,
              county: true,
              price: true,
              currency: true,
              listingType: true,
              ownerId: true,
              agent: { select: { userId: true } },
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          review: { select: { id: true } },
        },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({
      success: true,
      data: bookings.map((b) => ({
        ...b,
        hostUserId: b.property.agent?.userId ?? b.property.ownerId,
      })),
      view: "guest",
    });
  } catch (error) {
    console.error("List bookings error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load bookings" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in to book a stay" },
      { status: 401 },
    );
  }

  const { assertTenantContactAccess } = await import("@/lib/tenant-access");
  const access = await assertTenantContactAccess({
    userId: session.user.id,
    role: session.user.role,
  });
  if (!access.ok) {
    return NextResponse.json(
      {
        success: false,
        error: access.error,
        code: access.code,
        productId: access.productId,
        price: access.price,
        hours: access.hours,
      },
      { status: 402 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { propertyId, checkIn, checkOut, guests, guestMessage } = parsed.data;
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id: propertyId }, { slug: propertyId }],
        status: "ACTIVE",
        listingType: { in: ["HOLIDAY", "HOTEL"] },
      },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        ownerId: true,
        slug: true,
        listingType: true,
        agent: { select: { userId: true } },
      },
    });

    if (!property || !isStayListing(property.listingType)) {
      return NextResponse.json(
        { success: false, error: "Stay listing not found or unavailable" },
        { status: 404 },
      );
    }

    if (property.ownerId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot book your own listing" },
        { status: 400 },
      );
    }

    const nights = nightsBetween(checkInDate, checkOutDate);
    const listAmount = property.price * nights;
    const { getCustomerMembership } = await import("@/lib/customer-membership");
    const { applyMemberPrice } = await import("@/lib/membership");
    const membership = await getCustomerMembership(session.user.id);
    const memberPrice = applyMemberPrice(listAmount, membership.level);
    const totalAmount = memberPrice.guestPays;
    const { splitBnbPayment, bnbCommissionPercent } = await import(
      "@/lib/bnb-split"
    );
    const split = splitBnbPayment(totalAmount);
    const commissionPct = bnbCommissionPercent();
    const hostUserId = property.agent?.userId ?? property.ownerId;

    const stayKind = stayLabel(property.listingType);

    const bookingMessage = [
      `New ${stayKind} booking request for ${property.title}`,
      `Check-in: ${checkInDate.toLocaleDateString("en-KE")}`,
      `Check-out: ${checkOutDate.toLocaleDateString("en-KE")}`,
      `Guests: ${guests}`,
      `Nights: ${nights}`,
      `List price: ${property.currency} ${listAmount.toLocaleString()}`,
      `Member save (${memberPrice.discountPercent}% · Level ${membership.level}): ${property.currency} ${memberPrice.discountAmount.toLocaleString()}`,
      `Guest total: ${property.currency} ${totalAmount.toLocaleString()}`,
      `Platform fee (${commissionPct}%): ${property.currency} ${split.commissionAmount.toLocaleString()}`,
      `Host payout: ${property.currency} ${split.hostAmount.toLocaleString()}`,
      guestMessage ? `\nGuest note: ${guestMessage}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const booking = await prisma.booking.create({
      data: {
        propertyId: property.id,
        guestId: session.user.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests,
        nights,
        totalAmount,
        listAmount,
        memberDiscountAmount: memberPrice.discountAmount,
        memberLevel: membership.level,
        currency: property.currency,
        commissionAmount: split.commissionAmount,
        hostAmount: split.hostAmount,
        guestMessage: guestMessage || null,
        status: "PENDING",
      },
    });

    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: hostUserId,
        content: bookingMessage,
        propertyId: property.id,
      },
    });

    const hostUser = await prisma.user.findUnique({
      where: { id: hostUserId },
      select: { role: true },
    });

    await prisma.notification.create({
      data: {
        userId: hostUserId,
        type: "BOOKING",
        title: `New ${stayKind} booking request`,
        body: `${session.user.name ?? "A guest"} requested ${nights} night(s) at ${property.title}.`,
        link: inboxPathForRole(hostUser?.role ?? "SELLER", session.user.id, property.id),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: booking,
        hostUserId,
        propertyId: property.id,
        message: "Booking sent. Chat with the host in your inbox.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create booking error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to create booking" },
      { status: 500 },
    );
  }
}
