import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function dataUrlToResponse(image: string) {
  const match = image.match(/^data:([^;,]+);base64,([\s\S]+)$/i);
  if (!match) return null;

  try {
    const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    if (buffer.length === 0) return null;
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": match[1] || "image/jpeg",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: { image: true },
    });

    const image = user?.image?.trim();
    if (!image) {
      return new NextResponse(null, { status: 404 });
    }

    if (/^https?:\/\//i.test(image)) {
      return NextResponse.redirect(image, 302);
    }

    const fromDataUrl = dataUrlToResponse(image);
    if (fromDataUrl) return fromDataUrl;

    return new NextResponse(null, { status: 404 });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
