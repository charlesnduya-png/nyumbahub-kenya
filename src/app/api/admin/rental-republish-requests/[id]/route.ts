import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncPropertyAvailabilityFromRooms } from "@/lib/rental-rooms";

const updateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNotes: z.string().trim().max(2000).optional(),
});

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
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.rentalRepublishRequest.findUnique({
      where: { id },
      include: {
        property: true,
        rentalReservation: {
          select: { id: true, rentalRoomId: true, status: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 },
      );
    }

    if (existing.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "Request already handled" },
        { status: 400 },
      );
    }

    const { status, adminNotes } = parsed.data;

    if (status === "APPROVED") {
      await prisma.$transaction(async (tx) => {
        await tx.rentalRepublishRequest.update({
          where: { id },
          data: {
            status,
            adminNotes: adminNotes?.trim() || existing.adminNotes,
          },
        });

        const roomId = existing.rentalReservation.rentalRoomId;

        if (roomId) {
          await tx.propertyRentalRoom.update({
            where: { id: roomId },
            data: { status: "AVAILABLE" },
          });
          await syncPropertyAvailabilityFromRooms(tx, existing.propertyId);
        } else {
          await tx.property.update({
            where: { id: existing.propertyId },
            data: {
              status: "ACTIVE",
              isVerified: true,
              publishedAt: new Date(),
            },
          });
        }

        await tx.rentalReservation.update({
          where: { id: existing.rentalReservationId },
          data: { status: "CANCELLED" },
        });
      });
    } else {
      await prisma.rentalRepublishRequest.update({
        where: { id },
        data: {
          status,
          adminNotes: adminNotes?.trim() || existing.adminNotes,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update republish request" },
      { status: 500 },
    );
  }
}
