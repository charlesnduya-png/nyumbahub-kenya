import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listDemoAgents } from "@/lib/agents-store";
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

    try {
      const agents = await prisma.agent.findMany({
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
          _count: { select: { listings: true } },
        },
        orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
      });

      if (agents.length > 0) {
        return NextResponse.json({
          success: true,
          source: "database",
          data: agents.map((a) => ({
            id: a.id,
            name: a.user.name ?? "Agent",
            agency: a.agencyName ?? "Independent",
            county: a.county ?? "—",
            rating: a.rating,
            reviewCount: a.reviewCount,
            listingsCount: a._count.listings,
            image: a.user.image,
            isFeatured: a.isFeatured,
            isVerified: a.isVerified,
            slug: a.id,
          })),
        });
      }
    } catch {
      // fall through to demo
    }

    return NextResponse.json({
      success: true,
      source: "demo",
      data: listDemoAgents(),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load agents" },
      { status: 500 },
    );
  }
}
