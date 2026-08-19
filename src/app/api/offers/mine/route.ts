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

    const offers = await prisma.propertyOffer.findMany({
      where: { buyerId: session.user.id },
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
            town: true,
            county: true,
          },
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
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load your offers" },
      { status: 500 },
    );
  }
}
