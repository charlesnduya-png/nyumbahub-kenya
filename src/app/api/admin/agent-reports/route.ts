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

    const reports = await prisma.agentReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        agent: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        reporter: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        status: r.status,
        adminNotes: r.adminNotes,
        createdAt: r.createdAt.toISOString(),
        agent: {
          id: r.agent.id,
          name: r.agent.user.name ?? "Agent",
          email: r.agent.user.email,
        },
        reporter: {
          id: r.reporter.id,
          name: r.reporter.name ?? "Customer",
          email: r.reporter.email,
        },
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load agent reports" },
      { status: 500 },
    );
  }
}
