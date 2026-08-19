import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

async function requireAdmin() {
  const session = await auth();
  const isAdmin =
    Boolean(session?.user?.id) &&
    (session?.user?.role === "ADMIN" || isSiteOwnerEmail(session?.user?.email));
  if (!isAdmin) {
    return {
      error: NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      ),
    };
  }
  return { session };
}

const patchSchema = z.object({
  restricted: z.boolean(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate && gate.error) return gate.error;

    const { userId } = await params;
    const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Provide restricted true or false" },
        { status: 400 },
      );
    }

    const member = await prisma.accountTeamMember.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 },
      );
    }

    const roles = parsed.data.restricted ? (["READ"] as const) : (["INQUIRIES"] as const);
    const updated = await prisma.accountTeamMember.update({
      where: { userId },
      data: { roles: [...roles] },
      select: { userId: true, roles: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        userId: updated.userId,
        roles: updated.roles,
        restricted: parsed.data.restricted,
      },
    });
  } catch (error) {
    console.error("Admin restrict team member failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update team member" },
      { status: 500 },
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate && gate.error) return gate.error;

    const { userId } = await params;
    const member = await prisma.accountTeamMember.findUnique({
      where: { userId },
      select: {
        userId: true,
        user: { select: { role: true } },
      },
    });
    if (!member) {
      return NextResponse.json(
        { success: false, error: "Team member not found" },
        { status: 404 },
      );
    }

    const ownsTeam = await prisma.accountTeam.findUnique({
      where: { ownerId: userId },
      select: { id: true },
    });

    await prisma.$transaction([
      prisma.accountTeamMember.delete({ where: { userId } }),
      ...(!ownsTeam && member.user.role !== "ADMIN"
        ? [
            prisma.user.update({
              where: { id: userId },
              data: { role: "BUYER" },
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin delete team member failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to remove team member" },
      { status: 500 },
    );
  }
}
