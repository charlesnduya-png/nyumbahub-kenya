import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.literal("CANCELLED"),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update" },
        { status: 400 },
      );
    }

    const reservation = await prisma.rentalReservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 },
      );
    }

    if (reservation.tenantId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (!["PENDING", "APPROVED"].includes(reservation.status)) {
      return NextResponse.json(
        { success: false, error: "This reservation cannot be cancelled" },
        { status: 400 },
      );
    }

    const updated = await prisma.rentalReservation.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to cancel reservation" },
      { status: 500 },
    );
  }
}
