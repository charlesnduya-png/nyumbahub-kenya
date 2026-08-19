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
        accountTeamOwned: {
          select: {
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
            invites: {
              where: { acceptedAt: null, expiresAt: { gt: new Date() } },
              orderBy: { createdAt: "desc" },
              select: {
                id: true,
                email: true,
                roles: true,
                expiresAt: true,
              },
            },
          },
        },
        accountTeamMembers: {
          take: 1,
          select: {
            roles: true,
            team: {
              select: {
                owner: {
                  select: { id: true, name: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: users.map((u) => {
        const ownedCount = u._count.properties;
        const agentCount = u.agentProfile?._count.listings ?? 0;
        const isAgent = u.role === "AGENT";
        const ownedTeam = u.accountTeamOwned;
        const membership = u.accountTeamMembers[0] ?? null;
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
            ? {
                kind: "owner" as const,
                memberCount: ownedTeam.members.length,
                members: ownedTeam.members.map((m) => ({
                  userId: m.user.id,
                  name: m.user.name ?? m.user.email,
                  email: m.user.email,
                  isActive: m.user.isActive,
                  role: m.user.role,
                  roles: m.roles,
                })),
                pendingInvites: ownedTeam.invites.map((invite) => ({
                  email: invite.email,
                  roles: invite.roles,
                  expiresAt: invite.expiresAt.toISOString(),
                })),
              }
            : membership
              ? {
                  kind: "member" as const,
                  ownerId: membership.team.owner.id,
                  ownerName:
                    membership.team.owner.name ?? membership.team.owner.email,
                  ownerEmail: membership.team.owner.email,
                  roles: membership.roles,
                }
              : null,
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load users" },
      { status: 500 },
    );
  }
}
