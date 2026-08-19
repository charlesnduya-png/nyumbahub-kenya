import { z } from "zod";

/** Optional profile URL: empty string → null, bare domains get https:// */
export const optionalProfileUrl = z.preprocess(
  (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v !== "string") return v;
    const trimmed = v.trim();
    if (trimmed === "") return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  },
  z.string().url().max(500).nullable(),
);

export type AgentSocialLinks = {
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  tiktokUrl?: string | null;
};

export function hasAgentSocialLinks(links: AgentSocialLinks): boolean {
  return Boolean(
    links.website ||
      links.facebookUrl ||
      links.instagramUrl ||
      links.linkedinUrl ||
      links.twitterUrl ||
      links.tiktokUrl,
  );
}
