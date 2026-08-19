import { NextResponse } from "next/server";

import { MAX_LISTING_IMAGES } from "@/lib/listing-media";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const property = await prisma.property.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const [images, videos] = await Promise.all([
      prisma.propertyImage.findMany({
        where: { propertyId: property.id },
        orderBy: { order: "asc" },
        take: MAX_LISTING_IMAGES,
        select: {
          id: true,
          url: true,
          alt: true,
          order: true,
          isPrimary: true,
        },
      }),
      prisma.propertyVideo.findMany({
        where: { propertyId: property.id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          url: true,
          title: true,
          thumbnail: true,
        },
      }),
    ]);

    return NextResponse.json(
      { success: true, data: { images, videos } },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load gallery" },
      { status: 500 },
    );
  }
}
