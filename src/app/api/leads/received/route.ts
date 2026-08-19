import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProfessionalActingContext } from "@/lib/account-team";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const canView =
    ctx.permissions.manageInquiries ||
    (ctx.isTeamMember && ctx.teamMemberRole === "READ") ||
    session.user.role === "ADMIN";

  if (!canView) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const userId = ctx.actingOwnerId;

  try {
    const leads = await prisma.lead.findMany({
      where: {
        OR: [
          { agentId: userId },
          { property: { ownerId: userId } },
          { property: { agent: { userId } } },
        ],
      },
      include: {
        property: {
          select: { id: true, title: true, slug: true },
        },
        buyer: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("List leads error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load inquiries" },
      { status: 500 },
    );
  }
}
