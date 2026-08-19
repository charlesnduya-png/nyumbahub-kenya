import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const reservations = await prisma.rentalReservation.findMany({
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
        tenant: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: reservations.map((r) => ({
        id: r.id,
        moveInDate: r.moveInDate?.toISOString() ?? null,
        message: r.message,
        status: r.status,
        adminNotes: r.adminNotes,
        createdAt: r.createdAt.toISOString(),
        rentalRoom: r.rentalRoom,
        property: r.property,
        tenant: {
          id: r.tenant.id,
          name: r.tenant.name ?? "Tenant",
          email: r.tenant.email,
          phone: r.tenant.phone,
        },
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load rental reservations" },
      { status: 500 },
    );
  }
}
