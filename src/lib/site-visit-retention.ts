/** Shared SiteVisit retention — keep analytics scans bounded. */
export const SITE_VISIT_RETENTION_DAYS = 30;

export function siteVisitRetentionStart(now = new Date()): Date {
  return new Date(
    now.getTime() - SITE_VISIT_RETENTION_DAYS * 24 * 60 * 60 * 1000,
  );
}
