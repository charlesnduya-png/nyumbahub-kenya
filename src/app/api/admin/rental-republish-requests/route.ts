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

    const requests = await prisma.rentalRepublishRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, title: true, slug: true } },
        requester: { select: { id: true, name: true, email: true } },
        agent: { include: { user: { select: { id: true, name: true, email: true } } } },
        rentalReservation: {
          include: {
            tenant: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: requests.map((r) => ({
        id: r.id,
        property: r.property,
        requester: {
          id: r.requester.id,
          name: r.requester.name ?? "Host",
          email: r.requester.email,
        },
        agent: r.agent
          ? {
              id: r.agent.user.id,
              name: r.agent.user.name ?? "Agent",
              email: r.agent.user.email,
            }
          : null,
        tenant: {
          id: r.rentalReservation.tenant.id,
          name: r.rentalReservation.tenant.name ?? "Tenant",
          email: r.rentalReservation.tenant.email,
          phone: r.rentalReservation.tenant.phone,
        },
        reason: r.reason,
        status: r.status,
        adminNotes: r.adminNotes,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load republish requests" },
      { status: 500 },
    );
  }
}

