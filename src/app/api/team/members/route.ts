import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  TEAM_ROLE_VALUES,
  normalizeTeamRoles,
  resolveProfessionalActingContext,
} from "@/lib/account-team";
import { prisma } from "@/lib/prisma";
import { createAndSendTeamInvite } from "@/lib/team-invite";

const addMemberSchema = z.object({
  email: z.string().email(),
  roles: z.array(z.enum(TEAM_ROLE_VALUES)).optional(),
  role: z.enum(TEAM_ROLE_VALUES).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const team = await prisma.accountTeam.findUnique({
      where: { ownerId: ctx.actingOwnerId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        invites: {
          where: { acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ownerId: ctx.actingOwnerId,
        members:
          team?.members.map((m) => ({
            userId: m.userId,
            roles: m.roles,
            user: {
              id: m.user.id,
              name: m.user.name,
              email: m.user.email,
              image: m.user.image,
            },
          })) ?? [],
        invites:
          team?.invites.map((invite) => ({
            id: invite.id,
            email: invite.email,
            roles: invite.roles,
            expiresAt: invite.expiresAt,
            createdAt: invite.createdAt,
          })) ?? [],
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to load team" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!ctx.permissions.manageTeam) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = addMemberSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const roles = normalizeTeamRoles(
    parsed.data.roles ?? (parsed.data.role ? [parsed.data.role] : ["INQUIRIES"]),
  );

  try {
    if (email === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "You cannot invite yourself" },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, isActive: true, role: true },
    });

    if (targetUser && !targetUser.isActive) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (targetUser) {
      const alreadyMember = await prisma.accountTeamMember.findUnique({
        where: { userId: targetUser.id },
        select: { id: true, team: { select: { ownerId: true } } },
      });
      if (alreadyMember?.team.ownerId === ctx.actingOwnerId) {
        return NextResponse.json(
          { success: false, error: "This person is already on your team" },
          { status: 400 },
        );
      }
      if (alreadyMember) {
        return NextResponse.json(
          { success: false, error: "This account already belongs to another team" },
          { status: 400 },
        );
      }
    }

    const team = await prisma.accountTeam.upsert({
      where: { ownerId: ctx.actingOwnerId },
      create: { ownerId: ctx.actingOwnerId },
      update: {},
    });

    const owner = await prisma.user.findUnique({
      where: { id: ctx.actingOwnerId },
      select: { name: true, email: true },
    });

    const { invite, joinUrl, emailSent } = await createAndSendTeamInvite({
      teamId: team.id,
      email,
      roles,
      ownerName: owner?.name?.trim() || owner?.email || "A Your Home professional",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: invite.id,
        email: invite.email,
        roles: invite.roles,
        expiresAt: invite.expiresAt,
        emailSent,
        joinUrl: emailSent ? undefined : joinUrl,
      },
      message: emailSent
        ? "Invitation sent"
        : "Invitation created. Email could not be sent — copy the join link.",
    });
  } catch (error) {
    console.error("Create team invite failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to send team invitation.",
      },
      { status: 400 },
    );
  }
}
