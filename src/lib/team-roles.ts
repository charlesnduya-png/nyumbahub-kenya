export const TEAM_ROLE_VALUES = [
  "FULL",
  "LISTINGS",
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
