import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createBookingSchema,
  nightsBetween,
} from "@/lib/validations/booking";
import { resolveProfessionalActingContext } from "@/lib/account-team";

function inboxPathForRole(role: string, peerId: string, propertyId: string) {
  const params = new URLSearchParams({ peer: peerId, property: propertyId });
  if (role === "BUYER") {
    return `/dashboard/tenant/messages?${params.toString()}`;
  }
  return `/dashboard/pro/inbox?${params.toString()}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const canHostBookings =
    session.user.role === "ADMIN" ||
    ctx.permissions.manageBookings ||
    (ctx.isTeamMember && ctx.teamMemberRole === "READ");

  const hostUserId = ctx.actingOwnerId;
  const guestUserId = session.user.id;

  try {
    if (canHostBookings) {
      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { property: { ownerId: hostUserId } },
            { property: { agent: { userId: hostUserId } } },
          ],
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
        listingType: "HOLIDAY",
      },
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        ownerId: true,
        slug: true,
        agent: { select: { userId: true } },
      },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "BnB listing not found or unavailable" },
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
    const totalAmount = property.price * nights;
    const { bnbCommissionAmount, BNB_BOOKING_COMMISSION_RATE } = await import(
      "@/lib/pricing"
    );
    const commission = bnbCommissionAmount(totalAmount);
    const commissionPct = Math.round(BNB_BOOKING_COMMISSION_RATE * 100);
    const hostUserId = property.agent?.userId ?? property.ownerId;

    const bookingMessage = [
      `New BnB booking request for ${property.title}`,
      `Check-in: ${checkInDate.toLocaleDateString("en-KE")}`,
      `Check-out: ${checkOutDate.toLocaleDateString("en-KE")}`,
      `Guests: ${guests}`,
      `Nights: ${nights}`,
      `Total: ${property.currency} ${totalAmount.toLocaleString()}`,
      `Platform fee (${commissionPct}%): ${property.currency} ${commission.toLocaleString()}`,
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
        currency: property.currency,
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
        title: "New BnB booking request",
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
