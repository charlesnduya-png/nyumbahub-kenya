import { NextResponse } from "next/server";

import { getMediaAssetByPublicId } from "@/lib/media-assets";

interface RouteParams {
  params: Promise<{ publicId: string }>;
}

function dataUrlToResponse(image: string, mimeType?: string | null) {
  const match = image.match(/^data:([^;,]+);base64,([\s\S]+)$/i);
  if (!match) return null;

  try {
    const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    if (buffer.length === 0) return null;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": match[1] || mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { publicId: raw } = await params;
    const publicId = decodeURIComponent(raw);
    const asset = await getMediaAssetByPublicId(publicId);

    if (!asset) {
      return new NextResponse(null, { status: 404 });
    }

    if (/^https?:\/\//i.test(asset.url)) {
      return NextResponse.redirect(asset.url, 302);
    }

    const fromDataUrl = dataUrlToResponse(asset.url, asset.mimeType);
    if (fromDataUrl) return fromDataUrl;

    return new NextResponse(asset.url, {
      headers: {
        "Content-Type": asset.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
