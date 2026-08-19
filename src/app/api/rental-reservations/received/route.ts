import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const canView =
      session.user.role === "ADMIN" ||
      canViewWith(ctx, "manageBookings") ||
      canViewWith(ctx, "manageListings");

    if (!canView) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = ctx.actingOwnerId;
    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true },
    });

    const propertyFilter = agent
      ? { OR: [{ ownerId: userId }, { agentId: agent.id }] }
      : { ownerId: userId };

    const reservations = await prisma.rentalReservation.findMany({
      where: { property: propertyFilter },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
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
      { success: false, error: "Unable to load reservations" },
      { status: 500 },
    );
  }
}
