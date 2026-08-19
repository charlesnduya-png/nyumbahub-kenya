import type { TeamRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export {
  TEAM_ROLE_VALUES,
  TEAM_ROLE_LABEL,
  normalizeTeamRoles,
  type TeamRoleValue,
} from "@/lib/team-roles";

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
  teamMemberRoles: TeamRole[];
};

const NO_PERMISSIONS: TeamPermissions = {
  manageListings: false,
  manageInquiries: false,
  manageViewings: false,
  manageOffers: false,
  manageBookings: false,
  manageMessages: false,
  manageTeam: false,
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
      return { ...NO_PERMISSIONS, manageListings: true };
    case "INQUIRIES":
      return { ...NO_PERMISSIONS, manageInquiries: true };
    case "VIEWINGS":
      return { ...NO_PERMISSIONS, manageViewings: true };
    case "OFFERS":
      return { ...NO_PERMISSIONS, manageOffers: true };
    case "BOOKINGS":
      return { ...NO_PERMISSIONS, manageBookings: true };
    case "MESSAGES":
      return { ...NO_PERMISSIONS, manageMessages: true };
    case "READ":
    default:
      return { ...NO_PERMISSIONS };
  }
}

export function permissionsForTeamRoles(
  roles: readonly TeamRole[],
): TeamPermissions {
  if (roles.includes("FULL")) return permissionsForTeamRole("FULL");

  const merged = { ...NO_PERMISSIONS };
  for (const role of roles) {
    const next = permissionsForTeamRole(role);
    merged.manageListings ||= next.manageListings;
    merged.manageInquiries ||= next.manageInquiries;
    merged.manageViewings ||= next.manageViewings;
    merged.manageOffers ||= next.manageOffers;
    merged.manageBookings ||= next.manageBookings;
    merged.manageMessages ||= next.manageMessages;
    merged.manageTeam ||= next.manageTeam;
  }
  return merged;
}

export function canViewWith(
  ctx: ProfessionalActingContext,
  permission: keyof TeamPermissions,
): boolean {
  if (ctx.permissions[permission]) return true;
  return ctx.isTeamMember && ctx.teamMemberRoles.includes("READ");
}

export async function resolveProfessionalActingContext(
  userId: string,
): Promise<ProfessionalActingContext> {
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
      permissions: permissionsForTeamRoles(membership.roles),
      isTeamMember: true,
      teamMemberRoles: membership.roles,
    };
  }

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
      teamMemberRoles: [],
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isProfessional =
    user?.role === "SELLER" || user?.role === "AGENT" || user?.role === "ADMIN";

  return {
    actingOwnerId: userId,
    actingOwnerRole: user?.role ?? null,
    permissions: isProfessional
      ? permissionsForTeamRole("FULL")
      : permissionsForTeamRole("READ"),
    isTeamMember: false,
    teamMemberRoles: [],
  };
}
