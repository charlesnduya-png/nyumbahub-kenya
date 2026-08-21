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

    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        agent: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        images: { orderBy: { order: "asc" }, take: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      data: properties.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        price: p.price,
        currency: p.currency,
        listingType: p.listingType,
        propertyType: p.propertyType,
        country: p.country,
        county: p.county,
        town: p.town,
        status: p.status,
        isVerified: p.isVerified,
        views: p.views,
        createdAt: p.createdAt.toISOString(),
        owner: p.owner,
        agent: p.agent
          ? {
              id: p.agent.id,
              name: p.agent.user.name,
              email: p.agent.user.email,
            }
          : null,
        imageUrl: p.images[0]?.url ?? null,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load properties" },
      { status: 500 },
    );
  }
}
