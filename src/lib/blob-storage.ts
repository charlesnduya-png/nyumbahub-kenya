import { put } from "@vercel/blob";

/**
 * Blob uploads on Vercel prefer OIDC (BLOB_STORE_ID + short-lived token).
 * Fall back to BLOB_READ_WRITE_TOKEN for local/CI outside Vercel.
 * Never expose either value to the client (no NEXT_PUBLIC_*).
 */
export function isBlobConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim() ||
      process.env.VERCEL_OIDC_TOKEN?.trim(),
  );
}

export async function uploadFileToBlob(input: {
  data: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}) {
  const folder = input.folder ?? "your-home/properties";
  const safeName =
    input.filename.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") ||
    "photo.jpg";
  const pathname = `${folder}/${Date.now()}-${safeName}`;

  const blob = await put(pathname, input.data, {
    access: "public",
    contentType: input.contentType || "image/jpeg",
    addRandomSuffix: true,
  });

  return {
    url: blob.url,
    publicId: blob.pathname,
  };
}
