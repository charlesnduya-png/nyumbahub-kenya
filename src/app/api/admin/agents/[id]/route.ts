import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  getDemoAgent,
  setDemoAgentFeatured,
  setDemoAgentVerified,
} from "@/lib/agents-store";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Provide isFeatured and/or isVerified" },
        { status: 400 },
      );
    }

    const { isFeatured, isVerified } = parsed.data;

    try {
      const existing = await prisma.agent.findUnique({ where: { id } });

      if (!existing) {
        throw new Error("NOT_FOUND_DB");
      }

      const agent = await prisma.agent.update({
        where: { id },
        data: {
          ...(typeof isFeatured === "boolean" ? { isFeatured } : {}),
          ...(typeof isVerified === "boolean" ? { isVerified } : {}),
        },
        include: {
          user: { select: { name: true, image: true, email: true } },
          _count: { select: { listings: true } },
        },
      });

      return NextResponse.json({
        success: true,
        source: "database",
        data: {
          id: agent.id,
          name: agent.user.name ?? "Agent",
          agency: agent.agencyName ?? "Independent",
          county: agent.county ?? "—",
          rating: agent.rating,
          reviewCount: agent.reviewCount,
          listingsCount: agent._count.listings,
          image: agent.user.image,
          isFeatured: agent.isFeatured,
          isVerified: agent.isVerified,
          slug: agent.id,
        },
      });
    } catch {
      if (typeof isFeatured === "boolean") {
        setDemoAgentFeatured(id, isFeatured);
      }
      if (typeof isVerified === "boolean") {
        setDemoAgentVerified(id, isVerified);
      }

      const demo = getDemoAgent(id);
      if (!demo) {
        return NextResponse.json(
          { success: false, error: "Agent not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        source: "demo",
        data: demo,
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update agent" },
      { status: 500 },
    );
  }
}
