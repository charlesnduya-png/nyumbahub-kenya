import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const reservations = await prisma.rentalReservation.findMany({
      where: { tenantId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            town: true,
            county: true,
            status: true,
          },
        },
        rentalRoom: {
          select: { id: true, label: true, status: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: reservations });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load your reservations" },
      { status: 500 },
    );
  }
}
