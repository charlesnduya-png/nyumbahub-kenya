import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { notifyAdmins } from "@/lib/admin-notify";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  rentalReservationId: z.string().min(1),
  reason: z.string().trim().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const role = session.user.role;
    if (role !== "AGENT" && role !== "SELLER") {
      return NextResponse.json(
        { success: false, error: "Only property owners or agents can request republishing" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    const reservation = await prisma.rentalReservation.findUnique({
      where: { id: parsed.data.rentalReservationId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            agentId: true,
            ownerId: true,
            status: true,
            listingType: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 },
      );
    }

    if (reservation.status !== "RENTED") {
      return NextResponse.json(
        { success: false, error: "This rental is not eligible for republishing" },
        { status: 400 },
      );
    }

    if (reservation.property.listingType !== "RENT") {
      return NextResponse.json(
        { success: false, error: "Republishing is only for rent listings" },
        { status: 400 },
      );
    }

    const isOwner = reservation.property.ownerId === session.user.id;
    const isListingAgent = Boolean(
      agent && reservation.property.agentId === agent.id,
    );

    if (!isOwner && !isListingAgent) {
      return NextResponse.json(
        { success: false, error: "You can only republish listings you manage" },
        { status: 403 },
      );
    }

    const existing = await prisma.rentalRepublishRequest.findFirst({
      where: {
        rentalReservationId: reservation.id,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "A republish request is already pending" },
        { status: 409 },
      );
    }

    const requestRow = await prisma.rentalRepublishRequest.create({
      data: {
        propertyId: reservation.propertyId,
        rentalReservationId: reservation.id,
        requesterId: session.user.id,
        agentId: agent?.id ?? reservation.property.agentId,
        reason: parsed.data.reason?.trim() || null,
      },
    });

    await notifyAdmins({
      type: "RENTAL_RESERVATION",
      title: "Rental republish requested",
      body: `${session.user.name ?? "A host"} requested republishing for ${reservation.property.title}.`,
      link: "/dashboard/admin/rental-republish-requests",
    });

    return NextResponse.json(
      { success: true, data: requestRow, message: "Republish request sent to admin" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to submit republish request" },
      { status: 500 },
    );
  }
}
