import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncPropertyAvailabilityFromRooms } from "@/lib/rental-rooms";
import { updateRentalReservationSchema } from "@/lib/validations/rental-reservation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateRentalReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid review action" },
        { status: 400 },
      );
    }

    const { status, adminNotes } = parsed.data;

    const reservation = await prisma.rentalReservation.findUnique({
      where: { id },
      include: {
        property: { select: { id: true, title: true, status: true } },
        rentalRoom: { select: { id: true, label: true, status: true } },
        tenant: { select: { id: true, name: true } },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 },
      );
    }

    if (status === "RENTED") {
      if (reservation.rentalRoomId) {
        if (reservation.rentalRoom?.status === "RENTED") {
          return NextResponse.json(
            { success: false, error: "This room is already marked as rented" },
            { status: 400 },
          );
        }

        const sync = await prisma.$transaction(async (tx) => {
          await tx.propertyRentalRoom.update({
            where: { id: reservation.rentalRoomId! },
            data: { status: "RENTED" },
          });

          await tx.rentalReservation.update({
            where: { id },
            data: {
              status: "RENTED",
              adminNotes: adminNotes?.trim() || reservation.adminNotes,
            },
          });

          await tx.rentalReservation.updateMany({
            where: {
              rentalRoomId: reservation.rentalRoomId!,
              id: { not: id },
              status: { in: ["PENDING", "APPROVED"] },
            },
            data: {
              status: "REJECTED",
              adminNotes: "Room rented to another tenant.",
            },
          });

          return syncPropertyAvailabilityFromRooms(tx, reservation.propertyId);
        });

        const roomLabel = reservation.rentalRoom?.label ?? "Room";
        await prisma.notification.create({
          data: {
            userId: reservation.tenantId,
            type: "RENTAL_RESERVATION",
            title: "Rental confirmed",
            body:
              sync.propertyStatus === "RENTED"
                ? `Your reservation for ${reservation.property.title} (${roomLabel}) is confirmed. All rooms are now rented.`
                : `Your reservation for ${reservation.property.title} (${roomLabel}) is confirmed. ${sync.availableCount} room(s) still available on this listing.`,
            link: "/dashboard/tenant/rental-reservations",
          },
        });

        return NextResponse.json({
          success: true,
          message:
            sync.propertyStatus === "RENTED"
              ? "Room rented. All rooms are taken — listing removed from public rentals."
              : `Room rented. Listing stays live with ${sync.availableCount} room(s) still available.`,
        });
      }

      if (reservation.property.status === "RENTED") {
        return NextResponse.json(
          { success: false, error: "This property is already marked as rented" },
          { status: 400 },
        );
      }

      await prisma.$transaction([
        prisma.property.update({
          where: { id: reservation.propertyId },
          data: { status: "RENTED" },
        }),
        prisma.rentalReservation.update({
          where: { id },
          data: {
            status: "RENTED",
            adminNotes: adminNotes?.trim() || reservation.adminNotes,
          },
        }),
        prisma.rentalReservation.updateMany({
          where: {
            propertyId: reservation.propertyId,
            id: { not: id },
            status: { in: ["PENDING", "APPROVED"] },
          },
          data: {
            status: "REJECTED",
            adminNotes: "Property rented to another tenant.",
          },
        }),
      ]);

      await prisma.notification.create({
        data: {
          userId: reservation.tenantId,
          type: "RENTAL_RESERVATION",
          title: "Rental confirmed",
          body: `Your reservation for ${reservation.property.title} is confirmed. The listing is now marked as rented.`,
          link: "/dashboard/tenant/rental-reservations",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Property marked as rented and removed from public listings.",
      });
    }

    const updated = await prisma.rentalReservation.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes?.trim() || reservation.adminNotes,
      },
    });

    if (status === "APPROVED" || status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: reservation.tenantId,
          type: "RENTAL_RESERVATION",
          title:
            status === "APPROVED"
              ? "Rental reservation approved"
              : "Rental reservation declined",
          body: `Your reservation for ${reservation.property.title} was ${status === "APPROVED" ? "approved" : "declined"}.`,
          link: "/dashboard/tenant/rental-reservations",
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update reservation" },
      { status: 500 },
    );
  }
}
