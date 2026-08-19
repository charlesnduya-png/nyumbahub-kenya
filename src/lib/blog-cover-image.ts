/** Accepts Cloudinary URLs, internal media paths, and data URLs from uploads. */
export function normalizeBlogCoverImage(
  value?: string | null,
): string | null | "__invalid__" {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/api/media/")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return trimmed;
    }
  } catch {
    return "__invalid__";
  }

  return "__invalid__";
}
