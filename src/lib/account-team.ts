import type { TeamRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type TeamPermissions = {
  manageListings: boolean;
  manageInquiries: boolean;
  manageViewings: boolean;
  manageOffers: boolean;
  manageBookings: boolean;
  manageMessages: boolean;
  manageTeam: boolean;
};

export type ProfessionalActingContext = {
  actingOwnerId: string;
  actingOwnerRole: string | null;
  permissions: TeamPermissions;
  isTeamMember: boolean;
  teamMemberRole?: TeamRole;
};

export function permissionsForTeamRole(role: TeamRole): TeamPermissions {
  switch (role) {
    case "FULL":
      return {
        manageListings: true,
        manageInquiries: true,
        manageViewings: true,
        manageOffers: true,
        manageBookings: true,
        manageMessages: true,
        manageTeam: true,
      };
    case "LISTINGS":
      return {
        manageListings: true,
        manageInquiries: false,
        manageViewings: false,
        manageOffers: false,
        manageBookings: false,
        manageMessages: false,
        manageTeam: false,
      };
    case "INQUIRIES":
      return {
        manageListings: false,
        manageInquiries: true,
        manageViewings: false,
        manageOffers: false,
        manageBookings: false,
        manageMessages: false,
        manageTeam: false,
      };
    case "VIEWINGS":
      return {
        manageListings: false,
        manageInquiries: false,
        manageViewings: true,
        manageOffers: false,
        manageBookings: false,
        manageMessages: false,
        manageTeam: false,
      };
    case "OFFERS":
      return {
        manageListings: false,
        manageInquiries: false,
        manageViewings: false,
        manageOffers: true,
        manageBookings: false,
        manageMessages: false,
        manageTeam: false,
      };
    case "BOOKINGS":
      return {
        manageListings: false,
        manageInquiries: false,
        manageViewings: false,
        manageOffers: false,
        manageBookings: true,
        manageMessages: false,
        manageTeam: false,
      };
    case "MESSAGES":
      return {
        manageListings: false,
        manageInquiries: false,
        manageViewings: false,
        manageOffers: false,
        manageBookings: false,
        manageMessages: true,
        manageTeam: false,
      };
    case "READ":
    default:
      return {
        manageListings: false,
        manageInquiries: false,
        manageViewings: false,
        manageOffers: false,
        manageBookings: false,
        manageMessages: false,
        manageTeam: false,
      };
  }
}

export async function resolveProfessionalActingContext(
  userId: string,
): Promise<ProfessionalActingContext> {
  // Team member: act on behalf of their team owner.
  const membership = await prisma.accountTeamMember.findUnique({
    where: { userId },
    include: { team: { select: { ownerId: true } } },
  });

  if (membership) {
    const actingOwnerId = membership.team.ownerId;
    const actingOwner = await prisma.user.findUnique({
      where: { id: actingOwnerId },
      select: { role: true },
    });

    return {
      actingOwnerId,
      actingOwnerRole: actingOwner?.role ?? null,
      permissions: permissionsForTeamRole(membership.role),
      isTeamMember: true,
      teamMemberRole: membership.role,
    };
  }

  // Team owner: full permissions for their own account.
  const ownedTeam = await prisma.accountTeam.findUnique({
    where: { ownerId: userId },
    select: { id: true },
  });

  if (ownedTeam) {
    const actingOwner = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return {
      actingOwnerId: userId,
      actingOwnerRole: actingOwner?.role ?? null,
      permissions: permissionsForTeamRole("FULL"),
      isTeamMember: false,
    };
  }

  // Regular account (non-team): treat professional roles as full access.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isProfessional =
    user?.role === "SELLER" || user?.role === "AGENT" || user?.role === "ADMIN";

  return {
    actingOwnerId: userId,
    actingOwnerRole: user?.role ?? null,
    permissions: isProfessional ? permissionsForTeamRole("FULL") : permissionsForTeamRole("READ"),
    isTeamMember: false,
  };
}

