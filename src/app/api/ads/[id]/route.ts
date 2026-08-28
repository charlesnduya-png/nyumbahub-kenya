import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  action: z.enum(["view", "click"]),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const existing = await prisma.advertisement.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });
    if (!existing?.isActive) {
      return NextResponse.json(
        { success: false, error: "Ad not found" },
        { status: 404 },
      );
    }

    await prisma.advertisement.update({
      where: { id },
      data:
        parsed.data.action === "click"
          ? { clicks: { increment: 1 } }
          : { impressions: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Could not record ad event" },
      { status: 500 },
    );
  }
}
