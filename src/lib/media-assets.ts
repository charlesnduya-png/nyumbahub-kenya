import { prisma } from "@/lib/prisma";
import { parsePropertyVideoUrl } from "@/lib/property-video-url";

export function mediaAssetServePath(publicId: string) {
  return `/api/media/${encodeURIComponent(publicId)}`;
}

export async function saveMediaAsset(input: {
  userId: string;
  publicId: string;
  url: string;
  mimeType?: string | null;
}) {
  return prisma.mediaAsset.upsert({
    where: { publicId: input.publicId },
    create: {
      userId: input.userId,
      publicId: input.publicId,
      url: input.url,
      mimeType: input.mimeType ?? null,
    },
    update: {
      url: input.url,
      mimeType: input.mimeType ?? null,
    },
  });
}

export async function getMediaAssetByPublicId(publicId: string) {
  return prisma.mediaAsset.findUnique({
    where: { publicId },
  });
}

function publicIdFromServePath(url: string) {
  const prefix = "/api/media/";
  if (!url.startsWith(prefix)) return null;
  try {
    return decodeURIComponent(url.slice(prefix.length));
  } catch {
    return null;
  }
}

/**
 * Resolve a listing image to a URL safe to store on PropertyImage.
 * Prefers short /api/media/ paths for locally hosted uploads.
 */
export async function resolveListingImageForStorage(input: {
  url?: string | null;
  publicId?: string | null;
}) {
  const publicId =
    input.publicId?.trim() ||
    (input.url ? publicIdFromServePath(input.url) : null) ||
    null;

  if (publicId) {
    const asset = await getMediaAssetByPublicId(publicId);
    if (asset) {
      return {
        url: mediaAssetServePath(publicId),
        publicId,
      };
    }
  }

  const url = input.url?.trim();
  if (!url) {
    throw new Error("Image reference is missing");
  }

  if (url.startsWith("data:") && publicId) {
    return {
      url: mediaAssetServePath(publicId),
      publicId,
    };
  }

  return {
    url,
    publicId: publicId ?? input.publicId ?? null,
  };
}

export async function resolveListingImagesForStorage(
  images: Array<{
    url?: string | null;
    publicId?: string | null;
    alt?: string | null;
    isPrimary?: boolean;
    order?: number;
  }>,
) {
  return Promise.all(
    images.map(async (img, index) => {
      const resolved = await resolveListingImageForStorage(img);
      return {
        ...resolved,
        alt: img.alt ?? null,
        isPrimary: img.isPrimary,
        order: img.order ?? index,
      };
    }),
  );
}

/** Client-side: avoid sending huge data URLs in create-listing JSON. */
export function slimListingImagesForSubmit<
  T extends { url: string; publicId?: string },
>(images: T[]) {
  return images.map((img) => {
    if (img.url.startsWith("data:") && img.publicId) {
      return {
        ...img,
        url: mediaAssetServePath(img.publicId),
      };
    }
    return img;
  });
}

export async function resolveListingVideosForStorage(
  videos: Array<{
    url?: string | null;
    publicId?: string | null;
    title?: string | null;
    thumbnail?: string | null;
  }>,
) {
  return Promise.all(
    videos.map(async (video) => {
      const rawUrl = video.url?.trim();
      if (rawUrl?.startsWith("http")) {
        const parsed = parsePropertyVideoUrl(rawUrl);
        if (parsed) {
          return {
            url: parsed.url,
            publicId: video.publicId?.trim() || null,
            title: video.title?.trim() || null,
            thumbnail: video.thumbnail?.trim() || null,
          };
        }
      }

      const resolved = await resolveListingImageForStorage(video);
      return {
        url: resolved.url,
        publicId: resolved.publicId,
        title: video.title?.trim() || null,
        thumbnail: video.thumbnail?.trim() || null,
      };
    }),
  );
}

/** Client-side: avoid sending huge data URLs in create-listing JSON. */
export function slimListingVideosForSubmit<
  T extends { url: string; publicId?: string },
>(videos: T[]) {
  return slimListingImagesForSubmit(videos);
}
