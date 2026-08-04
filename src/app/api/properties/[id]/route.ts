import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMockPropertyBySlug, mockProperties } from "@/data/mock";
import {
  deleteDemoListing,
  getDemoListing,
  updateDemoListing,
} from "@/lib/listings-store";
import { prisma } from "@/lib/prisma";
import { updatePropertySchema } from "@/lib/validations/property";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    try {
      const property = await prisma.property.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          images: { orderBy: { order: "asc" } },
          videos: true,
          amenities: { include: { amenity: true } },
          nearbyPlaces: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              image: true,
            },
          },
          agent: {
            include: {
              user: {
                select: { id: true, name: true, image: true, phone: true },
              },
            },
          },
        },
      });

      if (property) {
        await prisma.property.update({
          where: { id: property.id },
          data: { views: { increment: 1 } },
        });
        return NextResponse.json({ success: true, data: property });
      }
    } catch {
      // fall through
    }

    const demo = getDemoListing(id);
    if (demo) {
      return NextResponse.json({ success: true, data: demo, source: "demo" });
    }

    const mock =
      getMockPropertyBySlug(id) ?? mockProperties.find((p) => p.id === id);

    if (!mock) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: mock, fallback: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to fetch property" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updatePropertySchema.safeParse({ ...body, id });

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { id: _propertyId, images: _images, parking: _parking, ...rest } =
      parsed.data;
    void _propertyId;
    void _images;
    void _parking;

    const updateData = rest;

    const isAdmin = session.user.role === "ADMIN";

    if (
      updateData.status &&
      ["ACTIVE", "REJECTED"].includes(updateData.status) &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Only admins can approve or reject listings",
        },
        { status: 403 },
      );
    }

    try {
      const existing = await prisma.property.findUnique({ where: { id } });

      if (existing) {
        const isOwner = existing.ownerId === session.user.id;
        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 },
          );
        }

        if (
          updateData.status &&
          isOwner &&
          !isAdmin &&
          !["DRAFT", "PENDING", "ARCHIVED"].includes(updateData.status)
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "Owners can only set DRAFT, PENDING, or ARCHIVED",
            },
            { status: 403 },
          );
        }

        const property = await prisma.property.update({
          where: { id },
          data: {
            ...updateData,
            ...(updateData.status === "ACTIVE"
              ? { publishedAt: new Date(), isVerified: true }
              : {}),
          },
        });

        return NextResponse.json({ success: true, data: property });
      }
    } catch {
      // demo fallback
    }

    const demo = updateDemoListing(id, updateData as Record<string, unknown>);
    if (demo) {
      return NextResponse.json({ success: true, data: demo, source: "demo" });
    }

    // Accept mock id updates for professional dashboard demo
    return NextResponse.json({
      success: true,
      data: { id, ...updateData },
      source: "demo",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update property" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const isAdmin = session.user.role === "ADMIN";

    try {
      const existing = await prisma.property.findUnique({ where: { id } });

      if (existing) {
        const isOwner = existing.ownerId === session.user.id;
        if (!isOwner && !isAdmin) {
          return NextResponse.json(
            { success: false, error: "Forbidden" },
            { status: 403 },
          );
        }

        await prisma.property.delete({ where: { id } });
        return NextResponse.json({ success: true, data: { id } });
      }
    } catch {
      // demo fallback
    }

    deleteDemoListing(id);

    return NextResponse.json({
      success: true,
      data: { id },
      source: "demo",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to delete property" },
      { status: 500 },
    );
  }
}
