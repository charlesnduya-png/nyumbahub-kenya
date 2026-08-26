/** Production hosts for the same Your Home app. */

export const PRIMARY_SITE_HOST = "yourhome.co.ke";
export const AFRICA_SITE_HOST = "yourhome.africa";

export const SITE_HOSTS = [PRIMARY_SITE_HOST, AFRICA_SITE_HOST] as const;

export type SiteHost = (typeof SITE_HOSTS)[number];

export const PRIMARY_SITE_URL = `https://${PRIMARY_SITE_HOST}`;
export const AFRICA_SITE_URL = `https://${AFRICA_SITE_HOST}`;

export const SITE_ORIGIN_URLS = [PRIMARY_SITE_URL, AFRICA_SITE_URL] as const;

/** Preferred origin for canonicals, sitemaps, Open Graph, and JSON-LD. */
export const CANONICAL_SITE_URL = PRIMARY_SITE_URL;

export const SITE_DOMAIN_LABEL = `${PRIMARY_SITE_HOST} and ${AFRICA_SITE_HOST}`;

export function normalizeSiteHost(host: string | null | undefined): string {
  return (host ?? "")
    .split(":")[0]
    .trim()
    .replace(/^www\./i, "")
    .toLowerCase();
}

export function isSiteHost(host: string | null | undefined): boolean {
  return (SITE_HOSTS as readonly string[]).includes(normalizeSiteHost(host));
}

export function originForHost(host: string | null | undefined): string {
  const normalized = normalizeSiteHost(host);
  if (normalized === AFRICA_SITE_HOST) return AFRICA_SITE_URL;
  if (normalized === PRIMARY_SITE_HOST) return PRIMARY_SITE_URL;
  return PRIMARY_SITE_URL;
}

/** SEO origin is always .co.ke so the two live domains do not compete. */
export function canonicalOrigin(): string {
  return CANONICAL_SITE_URL;
}

export function canonicalUrl(path = "/"): string {
  const suffix = !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  if (suffix === "/") return `${CANONICAL_SITE_URL}/`;
  return `${CANONICAL_SITE_URL}${suffix}`;
}
