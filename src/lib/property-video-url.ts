export type PropertyVideoKind = "direct" | "youtube" | "vimeo";

export interface ParsedPropertyVideoUrl {
  kind: PropertyVideoKind;
  /** URL stored in the database and used for playback */
  url: string;
  /** iframe src for YouTube/Vimeo; same as url for direct files */
  embedUrl: string;
}

function youtubeIdFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.slice(1).split("/")[0];
      return id || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts") {
        return parts[1] ?? null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function vimeoIdFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    const host = url.hostname.replace(/^www\./, "");
    if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;

    const parts = url.pathname.split("/").filter(Boolean);
    if (host === "player.vimeo.com" && parts[0] === "video") {
      return parts[1] ?? null;
    }
    return parts[0] ?? null;
  } catch {
    return null;
  }
}

export function parsePropertyVideoUrl(raw: string): ParsedPropertyVideoUrl | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    const youtubeId = youtubeIdFromUrl(trimmed);
    if (youtubeId) {
      const embedUrl = `https://www.youtube.com/embed/${youtubeId}`;
      return { kind: "youtube", url: embedUrl, embedUrl };
    }

    const vimeoId = vimeoIdFromUrl(trimmed);
    if (vimeoId) {
      const embedUrl = `https://player.vimeo.com/video/${vimeoId}`;
      return { kind: "vimeo", url: embedUrl, embedUrl };
    }

    return { kind: "direct", url: trimmed, embedUrl: trimmed };
  } catch {
    return null;
  }
}

export function isValidPropertyVideoUrl(raw: string): boolean {
  return parsePropertyVideoUrl(raw) !== null;
}
