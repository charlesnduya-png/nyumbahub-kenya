/** Keep JWT/session cookies small — never store base64 data URLs in auth tokens. */
export function safeSessionImage(image?: string | null): string | null {
  if (!image) return null;
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return null;
  if (trimmed.length > 500) return null;
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return null;
  }
  return trimmed;
}

export function isOversizedProfileImage(image?: string | null): boolean {
  if (!image) return false;
  if (image.startsWith("data:") && image.length > 500_000) return true;
  return image.length > 2_000_000;
}
