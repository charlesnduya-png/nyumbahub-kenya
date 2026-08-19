import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { prisma } from "@/lib/prisma";
import { createAndSendTeamInvite } from "@/lib/team-invite";

interface RouteParams {
  params: Promise<{ id: string }>;
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

  const { id } = await params;
  const invite = await prisma.accountTeamInvite.findUnique({
    where: { id },
    include: { team: { select: { ownerId: true } } },
  });

  if (!invite || invite.team.ownerId !== ctx.actingOwnerId) {
    return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });
  }

  await prisma.accountTeamInvite.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

export async function POST(_: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const invite = await prisma.accountTeamInvite.findUnique({
    where: { id },
    include: { team: { select: { ownerId: true } } },
  });

  if (!invite || invite.team.ownerId !== ctx.actingOwnerId || invite.acceptedAt) {
    return NextResponse.json({ success: false, error: "Invite not found" }, { status: 404 });
  }

  const owner = await prisma.user.findUnique({
    where: { id: ctx.actingOwnerId },
    select: { name: true, email: true },
  });

  const { emailSent, joinUrl } = await createAndSendTeamInvite({
    teamId: invite.teamId,
    email: invite.email,
    roles: invite.roles,
    ownerName: owner?.name?.trim() || owner?.email || "A Your Home professional",
  });

  return NextResponse.json({
    success: true,
    data: { emailSent, joinUrl: emailSent ? undefined : joinUrl },
    message: emailSent ? "Invitation resent" : "Invitation updated. Copy the join link.",
  });
}
