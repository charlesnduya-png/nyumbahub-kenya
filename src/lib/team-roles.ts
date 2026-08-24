export const TEAM_ROLE_VALUES = [
  "FULL",
  "LISTINGS",
  "RENTALS",
  "INQUIRIES",
  "VIEWINGS",
  "OFFERS",
  "BOOKINGS",
  "MESSAGES",
  "READ",
] as const;

export type TeamRoleValue = (typeof TEAM_ROLE_VALUES)[number];

export const TEAM_ROLE_LABEL: Record<TeamRoleValue, string> = {
  FULL: "Full access",
  LISTINGS: "Manage listings",
  RENTALS: "Boma yangu (plots & vacant rooms)",
  INQUIRIES: "Manage inquiries",
  VIEWINGS: "Manage viewings",
  OFFERS: "Manage offers",
  BOOKINGS: "Manage bookings",
  MESSAGES: "Manage messages",
  READ: "Read-only",
};

export function normalizeTeamRoles(roles: readonly string[] | null | undefined): TeamRoleValue[] {
  const unique = TEAM_ROLE_VALUES.filter((role) => roles?.includes(role));
  if (unique.includes("FULL")) return ["FULL"];
  return unique.length > 0 ? unique : ["INQUIRIES"];
}

export type TeamNavPermissions = {
  manageListings: boolean;
  manageInquiries: boolean;
  manageViewings: boolean;
  manageOffers: boolean;
  manageBookings: boolean;
  manageMessages: boolean;
  manageTeam: boolean;
  manageRentals: boolean;
};

export type TeamNavState = {
  isTeamMember: boolean;
  ownerName: string;
  roles: TeamRoleValue[];
  permissions: TeamNavPermissions;
};

const OWNER_ONLY_HREFS = new Set([
  "/dashboard/pro/profile",
  "/dashboard/seller/promote",
  "/dashboard/seller/analytics",
  "/dashboard/agent/subscription",
  "/dashboard/agent/clients",
  "/dashboard/agent/crm",
]);

export function canAccessNavHref(
  href: string,
  team: TeamNavState | null | undefined,
): boolean {
  if (!team?.isTeamMember) return true;
  if (OWNER_ONLY_HREFS.has(href)) return false;

  const { permissions, roles } = team;
  const canRead = roles.includes("READ") || roles.includes("FULL");

  if (
    href === "/dashboard/pro" ||
    href === "/dashboard/notifications"
  ) {
    return true;
  }
  if (href === "/dashboard/pro/team") {
    return permissions.manageTeam;
  }
  if (href === "/dashboard/pro/inbox") {
    return permissions.manageMessages || canRead;
  }
  if (href === "/dashboard/pro/listings") {
    return permissions.manageListings || canRead;
  }
  if (href === "/dashboard/pro/plots") {
    return permissions.manageListings || permissions.manageRentals || canRead;
  }
  if (href === "/dashboard/pro/rent") {
    return permissions.manageListings || canRead;
  }
  if (href === "/dashboard/seller/properties/new") {
    return permissions.manageListings;
  }
  if (href === "/dashboard/pro/inquiries") {
    return permissions.manageInquiries || canRead;
  }
  if (href === "/dashboard/pro/viewings") {
    return permissions.manageViewings || canRead;
  }
  if (href === "/dashboard/pro/offers") {
    return permissions.manageOffers || canRead;
  }
  if (href === "/dashboard/pro/bookings") {
    return permissions.manageBookings || canRead;
  }
  if (href === "/dashboard/pro/wallet") {
    return (
      permissions.manageTeam ||
      permissions.manageBookings ||
      permissions.manageListings
    );
  }
  if (href === "/dashboard/pro/rental-reservations") {
    return permissions.manageListings || permissions.manageBookings || canRead;
  }
  return permissions.manageTeam;
}
