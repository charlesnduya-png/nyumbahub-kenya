/** Canonical site-owner admin account (safe for client + server) */
export const SITE_OWNER_EMAIL = "charlesnduya84@gmail.com";

/** Cookie used so middleware can recognize owner even with a stale JWT */
export const SITE_OWNER_COOKIE = "nh-site-owner";

export function isSiteOwnerEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === SITE_OWNER_EMAIL);
}

export function dashboardHomeForRole(
  role?: string | null,
  email?: string | null,
): string {
  if (isSiteOwnerEmail(email) || role === "ADMIN") return "/dashboard/admin";
  if (role === "JOB_PARTNER") return "/dashboard/jobs";
  if (role === "SELLER" || role === "AGENT") return "/dashboard/pro";
  return "/dashboard/tenant";
}
