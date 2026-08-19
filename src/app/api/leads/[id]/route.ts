import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProfessionalActingContext } from "@/lib/account-team";

const updateLeadSchema = z.object({
  status: z.enum([
    "NEW",
    "CONTACTED",
    "QUALIFIED",
    "VIEWING_SCHEDULED",
    "NEGOTIATING",
    "WON",
    "LOST",
  ]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        property: {
          select: { ownerId: true, agent: { select: { userId: true } } },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { success: false, error: "Inquiry not found" },
        { status: 404 },
      );
    }

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const isAdmin = session.user.role === "ADMIN";

    if (!isAdmin && !ctx.permissions.manageInquiries) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const actingOwnerId = ctx.actingOwnerId;
    const canManage =
      lead.agentId === actingOwnerId ||
      lead.property.ownerId === actingOwnerId ||
      lead.property.agent?.userId === actingOwnerId ||
      isAdmin;

    if (!canManage) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update lead error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update inquiry" },
      { status: 500 },
    );
  }
}
