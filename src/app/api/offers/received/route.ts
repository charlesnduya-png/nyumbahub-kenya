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
      session.user.role === "ADMIN" || canViewWith(ctx, "manageOffers");

    if (!canView) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = ctx.actingOwnerId;

    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true },
    });

    const propertyFilter = agent
      ? {
          OR: [{ ownerId: userId }, { agentId: agent.id }],
        }
      : { ownerId: userId };

    const offers = await prisma.propertyOffer.findMany({
      where: {
        property: propertyFilter,
      },
      orderBy: { createdAt: "desc" },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
            currency: true,
            listingType: true,
          },
        },
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: offers.map((o) => ({
        id: o.id,
        amount: o.amount,
        currency: o.currency,
        message: o.message,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        property: o.property,
        buyer: {
          id: o.buyer.id,
          name: o.buyer.name ?? "Buyer",
          email: o.buyer.email,
          phone: o.buyer.phone,
        },
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load offers" },
      { status: 500 },
    );
  }
}
