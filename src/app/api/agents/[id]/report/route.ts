import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { notifyAdmins } from "@/lib/admin-notify";
import { prisma } from "@/lib/prisma";

const reportSchema = z.object({
  reason: z.enum([
    "FRAUD",
    "HARASSMENT",
    "MISLEADING",
    "UNRESPONSIVE",
    "OTHER",
  ]),
  details: z.string().max(2000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in to report an agent" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid report",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    });

    if (!agent) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 },
      );
    }

    if (agent.userId === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot report yourself" },
        { status: 400 },
      );
    }

    const existing = await prisma.agentReport.findFirst({
      where: {
        agentId: agent.id,
        reporterId: session.user.id,
        status: "PENDING",
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending report for this agent",
        },
        { status: 409 },
      );
    }

    const report = await prisma.agentReport.create({
      data: {
        agentId: agent.id,
        reporterId: session.user.id,
        reason: parsed.data.reason,
        details: parsed.data.details?.trim() || null,
      },
    });

    const agentName = agent.user.name ?? "An agent";
    await notifyAdmins({
      type: "AGENT_REPORT",
      title: "New agent report",
      body: `${session.user.name ?? "A customer"} reported ${agentName} (${parsed.data.reason.replace("_", " ").toLowerCase()}).`,
      link: "/dashboard/admin/reported-accounts",
    });

    return NextResponse.json(
      {
        success: true,
        data: { id: report.id },
        message: "Report submitted. Our team will review it shortly.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to submit report" },
      { status: 500 },
    );
  }
}
