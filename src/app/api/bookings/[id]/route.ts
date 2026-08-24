import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateBookingStatusSchema } from "@/lib/validations/booking";
import { resolveProfessionalActingContext } from "@/lib/account-team";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const hostUserId = ctx.actingOwnerId;
  const isAdmin = session.user.role === "ADMIN";

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateBookingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status update" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            agent: { select: { userId: true } },
          },
        },
        guest: { select: { id: true, name: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    const isOwner =
      booking.property.ownerId === hostUserId ||
      booking.property.agent?.userId === hostUserId ||
      isAdmin;
    const isGuest = booking.guestId === session.user.id;
    const { status, ownerNote } = parsed.data;

    if (isOwner && !isAdmin && !ctx.permissions.manageBookings) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (status === "CANCELLED") {
      if (!isGuest && !isOwner) {
        return NextResponse.json(
          { success: false, error: "Not allowed" },
          { status: 403 },
        );
      }
      if (booking.status === "COMPLETED") {
        return NextResponse.json(
          { success: false, error: "Completed bookings cannot be cancelled" },
          { status: 400 },
        );
      }
    } else if (status === "APPROVED" || status === "REJECTED") {
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: "Only the property owner can approve bookings" },
          { status: 403 },
        );
      }
      if (booking.status !== "PENDING") {
        return NextResponse.json(
          { success: false, error: "Only pending bookings can be approved or rejected" },
          { status: 400 },
        );
      }
    } else if (status === "COMPLETED") {
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: "Only the property owner can complete bookings" },
          { status: 403 },
        );
      }
      if (booking.status !== "APPROVED") {
        return NextResponse.json(
          { success: false, error: "Only approved bookings can be marked complete" },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status,
        ...(ownerNote !== undefined ? { ownerNote } : {}),
      },
    });

    try {
      const { syncBookingWallet } = await import("@/lib/wallet");
      await syncBookingWallet(prisma, updated.id);
    } catch (walletError) {
      console.error("Booking wallet sync failed:", walletError);
    }

    if (status === "APPROVED" || status === "REJECTED") {
      const hostId = hostUserId;
      const statusMessage =
        status === "APPROVED"
          ? `Your booking for ${booking.property.title} was approved. See you on ${new Date(booking.checkIn).toLocaleDateString("en-KE")}!`
          : `Your booking request for ${booking.property.title} was declined.${ownerNote ? ` Note: ${ownerNote}` : ""}`;

      await prisma.message.create({
        data: {
          senderId: hostId,
          receiverId: booking.guestId,
          content: statusMessage,
          propertyId: booking.property.id,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "BOOKING",
          title:
            status === "APPROVED"
              ? "Booking approved"
              : "Booking declined",
          body:
            status === "APPROVED"
              ? `Your stay at ${booking.property.title} was approved by the host.`
              : `Your stay request for ${booking.property.title} was declined.`,
          link: `/dashboard/tenant/messages?peer=${hostId}&property=${booking.property.id}`,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update booking error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update booking" },
      { status: 500 },
    );
  }
}
