import { NextResponse } from "next/server";

import { notifyAdmins } from "@/lib/admin-notify";
import { auth } from "@/lib/auth";
import { getPropertyHostUserId } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { createRentalReservationSchema } from "@/lib/validations/rental-reservation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in to reserve this rental" },
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

    const { id } = await params;
    const body = await request.json();
    const parsed = createRentalReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid reservation" },
        { status: 400 },
      );
    }

    const hostInfo = await getPropertyHostUserId(id);

    if (!hostInfo) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: hostInfo.propertyId },
      select: {
        id: true,
        title: true,
        status: true,
        listingType: true,
        ownerId: true,
        rentalRooms: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, label: true, status: true },
        },
      },
    });

    if (!property || property.listingType !== "RENT") {
      return NextResponse.json(
        { success: false, error: "This property is not available for rent" },
        { status: 400 },
      );
    }

    if (property.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This rental is no longer available" },
        { status: 400 },
      );
    }

    if (
      property.ownerId === session.user.id ||
      hostInfo.hostUserId === session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "You cannot reserve your own listing" },
        { status: 400 },
      );
    }

    const rooms = property.rentalRooms;
    let rentalRoomId: string | null = null;

    if (rooms.length > 0) {
      const requestedId = parsed.data.rentalRoomId;
      if (!requestedId) {
        return NextResponse.json(
          {
            success: false,
            error: "Choose which room you want to reserve",
            code: "ROOM_REQUIRED",
          },
          { status: 400 },
        );
      }

      const room = rooms.find((r) => r.id === requestedId);
      if (!room) {
        return NextResponse.json(
          { success: false, error: "Selected room was not found" },
          { status: 400 },
        );
      }
      if (room.status !== "AVAILABLE") {
        return NextResponse.json(
          { success: false, error: "That room is already rented" },
          { status: 400 },
        );
      }
      rentalRoomId = room.id;
    }

    const existing = await prisma.rentalReservation.findFirst({
      where: {
        propertyId: property.id,
        tenantId: session.user.id,
        status: { in: ["PENDING", "APPROVED"] },
        ...(rentalRoomId ? { rentalRoomId } : {}),
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: rentalRoomId
            ? "You already have an active reservation for this room"
            : "You already have an active reservation for this rental",
        },
        { status: 409 },
      );
    }

    let moveInDate: Date | null = null;
    if (parsed.data.moveInDate) {
      const parsedDate = new Date(parsed.data.moveInDate);
      if (!Number.isNaN(parsedDate.getTime())) {
        moveInDate = parsedDate;
      }
    }

    const roomLabel = rentalRoomId
      ? rooms.find((r) => r.id === rentalRoomId)?.label
      : null;

    const reservation = await prisma.rentalReservation.create({
      data: {
        propertyId: property.id,
        rentalRoomId,
        tenantId: session.user.id,
        moveInDate,
        message: parsed.data.message?.trim() || null,
      },
    });

    const label = roomLabel
      ? `${property.title} (${roomLabel})`
      : property.title;

    await notifyAdmins({
      type: "RENTAL_RESERVATION",
      title: "New rental reservation",
      body: `${session.user.name ?? "A tenant"} reserved ${label}.`,
      link: "/dashboard/admin/rental-reservations",
    });

    await prisma.notification.create({
      data: {
        userId: hostInfo.hostUserId,
        type: "RENTAL_RESERVATION",
        title: "New rental reservation",
        body: `${session.user.name ?? "A tenant"} wants to rent ${label}.`,
        link: "/dashboard/pro/rental-reservations",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: reservation,
        message: roomLabel
          ? `Reservation for ${roomLabel} submitted. Other rooms stay available until booked.`
          : "Reservation submitted. The owner and admin will review it.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to submit reservation" },
      { status: 500 },
    );
  }
}
