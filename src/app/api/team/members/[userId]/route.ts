import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProfessionalActingContext } from "@/lib/account-team";

const updateMemberSchema = z.object({
  role: z.enum([
    "FULL",
    "LISTINGS",
    "INQUIRIES",
    "VIEWINGS",
    "OFFERS",
    "BOOKINGS",
    "MESSAGES",
    "READ",
  ]),
});

interface RouteParams {
  params: Promise<{ userId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  const body = await request.json().catch(() => ({}));
  const parsed = updateMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const member = await prisma.accountTeamMember.findUnique({
    where: { userId },
    include: { team: { select: { ownerId: true } } },
  });

  if (!member) {
    return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
  }

  if (member.team.ownerId !== ctx.actingOwnerId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.accountTeamMember.update({
    where: { userId },
    data: { role: parsed.data.role },
  });

  return NextResponse.json({ success: true, data: { userId, role: updated.role } });
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await params;

  const member = await prisma.accountTeamMember.findUnique({
    where: { userId },
    include: { team: { select: { ownerId: true } } },
  });

  if (!member) {
    return NextResponse.json({ success: false, error: "Member not found" }, { status: 404 });
  }

  if (member.team.ownerId !== ctx.actingOwnerId) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  await prisma.accountTeamMember.delete({ where: { userId } });
  return NextResponse.json({ success: true });
}

