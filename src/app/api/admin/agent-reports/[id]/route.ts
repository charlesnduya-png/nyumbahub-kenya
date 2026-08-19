import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  status: z.enum(["REVIEWED", "DISMISSED"]),
  adminNotes: z.string().max(2000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

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
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update" },
        { status: 400 },
      );
    }

    const existing = await prisma.agentReport.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 },
      );
    }

    const report = await prisma.agentReport.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNotes: parsed.data.adminNotes?.trim() || existing.adminNotes,
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update report" },
      { status: 500 },
    );
  }
}
