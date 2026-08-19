import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

export async function GET() {
  try {
    const session = await auth();
    const isAdmin =
      session?.user?.role === "ADMIN" ||
      isSiteOwnerEmail(session?.user?.email);

    if (!session?.user?.id || !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const teams = await prisma.accountTeam.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        members: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    const invites = teams.length
      ? await prisma.accountTeamInvite.findMany({
          where: {
            teamId: { in: teams.map((team) => team.id) },
            acceptedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
          select: {
            teamId: true,
            email: true,
            roles: true,
            expiresAt: true,
          },
        })
      : [];

    const invitesByTeamId = new Map<string, typeof invites>();
    for (const invite of invites) {
      const list = invitesByTeamId.get(invite.teamId) ?? [];
      list.push(invite);
      invitesByTeamId.set(invite.teamId, list);
    }

    return NextResponse.json({
      success: true,
      data: teams.map((team) => ({
        ownerId: team.owner.id,
        adminName: team.owner.name ?? team.owner.email,
        adminEmail: team.owner.email,
        adminRole: team.owner.role,
        adminActive: team.owner.isActive,
        members: team.members.map((member) => ({
          userId: member.user.id,
          name: member.user.name ?? member.user.email,
          email: member.user.email,
          isActive: member.user.isActive,
          roles: member.roles,
        })),
        pendingInvites: (invitesByTeamId.get(team.id) ?? []).map((invite) => ({
          email: invite.email,
          roles: invite.roles,
          expiresAt: invite.expiresAt.toISOString(),
        })),
      })),
    });
  } catch (error) {
    console.error("Admin teams load failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load teams" },
      { status: 500 },
    );
  }
}
