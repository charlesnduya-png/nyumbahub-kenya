import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

function mapOwnedTeam(team: {
  members: Array<{
    user: {
      id: string;
      name: string | null;
      email: string;
      isActive: boolean;
      role: string;
    };
    roles: string[];
  }>;
  invites: Array<{
    email: string;
    roles: string[];
    expiresAt: Date;
  }>;
}) {
  return {
    kind: "owner" as const,
    memberCount: team.members.length,
    members: team.members.map((m) => ({
      userId: m.user.id,
      name: m.user.name ?? m.user.email,
      email: m.user.email,
      isActive: m.user.isActive,
      role: m.user.role,
      roles: m.roles,
    })),
    pendingInvites: team.invites.map((invite) => ({
      email: invite.email,
      roles: invite.roles,
      expiresAt: invite.expiresAt.toISOString(),
    })),
  };
}

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

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        image: true,
        nationalId: true,
        nationalIdVerified: true,
        verificationStatus: true,
        _count: { select: { properties: true } },
        agentProfile: {
          select: {
            id: true,
            isFeatured: true,
            isVerified: true,
            agencyName: true,
            licenseNumber: true,
            county: true,
            verificationStatus: true,
            _count: { select: { listings: true } },
          },
        },
      },
    });

    const teams = await prisma.accountTeam
      .findMany({
        orderBy: { updatedAt: "desc" },
        include: {
          owner: {
            select: { id: true, name: true, email: true, role: true, isActive: true },
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
                  role: true,
                },
              },
            },
          },
        },
      })
      .catch((error) => {
        console.error("Admin account teams query failed:", error);
        return [];
      });

    const invites = teams.length
      ? await prisma.accountTeamInvite
          .findMany({
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
          .catch((error) => {
            console.error("Admin team invites query failed:", error);
            return [];
          })
      : [];

    const invitesByTeamId = new Map<string, typeof invites>();
    for (const invite of invites) {
      const list = invitesByTeamId.get(invite.teamId) ?? [];
      list.push(invite);
      invitesByTeamId.set(invite.teamId, list);
    }

    const workspaces = teams.map((team) => ({
      ...team,
      invites: invitesByTeamId.get(team.id) ?? [],
    }));

    const teamByOwnerId = new Map(workspaces.map((team) => [team.ownerId, team]));
    const membershipByUserId = new Map(
      workspaces.flatMap((team) =>
        team.members.map((member) => [member.userId, { team, member }] as const),
      ),
    );

    const data = users.map((u) => {
      const ownedCount = u._count.properties;
      const agentCount = u.agentProfile?._count.listings ?? 0;
      const isAgent = u.role === "AGENT";
      const ownedTeam = teamByOwnerId.get(u.id);
      const membership = membershipByUserId.get(u.id);
      const isVerified = isAgent
        ? (u.agentProfile?.isVerified ?? false)
        : u.verificationStatus === "VERIFIED" ||
          u.nationalIdVerified === "VERIFIED";

      return {
        id: u.id,
        name: u.name ?? "—",
        email: u.email,
        phone: u.phone ?? "—",
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt.toISOString(),
        image: u.image,
        nationalId: u.nationalId ?? null,
        nationalIdVerified: u.nationalIdVerified,
        verificationStatus: u.verificationStatus,
        isVerified,
        hasAgentProfile: Boolean(u.agentProfile),
        agentId: u.agentProfile?.id ?? null,
        agencyName: u.agentProfile?.agencyName ?? null,
        licenseNumber: u.agentProfile?.licenseNumber ?? null,
        agentCounty: u.agentProfile?.county ?? null,
        agentVerificationStatus: u.agentProfile?.verificationStatus ?? null,
        ownedListingCount: ownedCount,
        agentListingCount: agentCount,
        listingCount: ownedCount + agentCount,
        team: ownedTeam
          ? mapOwnedTeam(ownedTeam)
          : membership
            ? {
                kind: "member" as const,
                ownerId: membership.team.owner.id,
                ownerName:
                  membership.team.owner.name ?? membership.team.owner.email,
                ownerEmail: membership.team.owner.email,
                roles: membership.member.roles,
              }
            : null,
      };
    });

    return NextResponse.json({
      success: true,
      data,
      teams: workspaces.map((team) => ({
        ownerId: team.owner.id,
        ownerName: team.owner.name ?? team.owner.email,
        ownerEmail: team.owner.email,
        ownerRole: team.owner.role,
        ownerActive: team.owner.isActive,
        ...mapOwnedTeam(team),
      })),
    });
  } catch (error) {
    console.error("Admin users load failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load users" },
      { status: 500 },
    );
  }
}
