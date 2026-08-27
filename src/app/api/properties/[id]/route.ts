import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveListingImagesForStorage, resolveListingVideosForStorage } from "@/lib/media-assets";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { flagsFromListingFeatures } from "@/lib/listing-features";
import { syncPropertyListingFeatures } from "@/lib/listing-features-db";
import { revalidatePropertySlug } from "@/lib/properties";
import { updatePropertySchema } from "@/lib/validations/property";

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

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    await prisma.property.update({
      where: { id: property.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: property });
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
      const flat = parsed.error.flatten();
      const firstFieldError = Object.values(flat.fieldErrors).flat()[0];
      return NextResponse.json(
        {
          success: false,
          error: firstFieldError ?? flat.formErrors[0] ?? "Validation failed",
          details: flat,
        },
        { status: 400 },
      );
    }

    const {
      id: _propertyId,
      images,
      videos,
      parking: _parking,
      rentalRooms,
      rentalRoomsCount,
      features,
      ...rest
    } = parsed.data;
    void _propertyId;
    void _parking;

    const featureFlags =
      features !== undefined ? flagsFromListingFeatures(features) : null;
    const updateData = {
      ...rest,
      ...(featureFlags
        ? {
            furnished: featureFlags.furnished,
            swimmingPool: featureFlags.swimmingPool,
            security: featureFlags.security,
          }
        : {}),
    };
    const isAdmin = session.user.role === "ADMIN";
    const ctx = await resolveProfessionalActingContext(session.user.id);

    if (!isAdmin && !ctx.permissions.manageListings) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

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

    const existing = await prisma.property.findUnique({
      where: { id },
      include: { agent: { select: { userId: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const isOwner = existing.ownerId === ctx.actingOwnerId;
    const isListingAgent = existing.agent?.userId === ctx.actingOwnerId;
    if (!isOwner && !isListingAgent && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    if (
      updateData.status &&
      (isOwner || isListingAgent) &&
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

    const property = await prisma.$transaction(async (tx) => {
      if (images !== undefined) {
        await tx.propertyImage.deleteMany({ where: { propertyId: id } });

        if (images.length > 0) {
          const resolvedImages = await resolveListingImagesForStorage(images);
          const hasPrimary = resolvedImages.some((img) => img.isPrimary);
          await tx.propertyImage.createMany({
            data: resolvedImages.map((img, index) => ({
              propertyId: id,
              url: img.url,
              publicId: img.publicId ?? null,
              alt: img.alt ?? existing.title,
              order: img.order ?? index,
              isPrimary: hasPrimary ? Boolean(img.isPrimary) : index === 0,
            })),
          });
        }
      }

      if (videos !== undefined) {
        await tx.propertyVideo.deleteMany({ where: { propertyId: id } });

        if (videos.length > 0) {
          const resolvedVideos = await resolveListingVideosForStorage(videos);
          await tx.propertyVideo.createMany({
            data: resolvedVideos.map((video) => ({
              propertyId: id,
              url: video.url,
              publicId: video.publicId ?? null,
              title: video.title,
              thumbnail: video.thumbnail,
            })),
          });
        }
      }

      const nextListingType = updateData.listingType ?? existing.listingType;
      const shouldReplaceRooms =
        nextListingType === "RENT" &&
        (rentalRooms !== undefined || rentalRoomsCount !== undefined);

      if (shouldReplaceRooms) {
        const rentedCount = await tx.propertyRentalRoom.count({
          where: { propertyId: id, status: "RENTED" },
        });
        if (rentedCount > 0) {
          throw new Error(
            "Cannot change room inventory while some rooms are already rented",
          );
        }

        await tx.propertyRentalRoom.deleteMany({ where: { propertyId: id } });

        const roomRows =
          rentalRooms && rentalRooms.length > 0
            ? rentalRooms.map((room, index) => ({
                propertyId: id,
                label: room.label,
                floor: room.floor ?? null,
                price: room.price ?? null,
                sortOrder: index,
              }))
            : rentalRoomsCount && rentalRoomsCount > 1
              ? Array.from({ length: rentalRoomsCount }, (_, index) => ({
                  propertyId: id,
                  label: `Room ${index + 1}`,
                  floor: null as string | null,
                  price: null as number | null,
                  sortOrder: index,
                }))
              : [];

        if (roomRows.length > 0) {
          await tx.propertyRentalRoom.createMany({ data: roomRows });
        }
      }

      if (features !== undefined) {
        await syncPropertyListingFeatures(tx, id, features);
      }

      return tx.property.update({
        where: { id },
        data: {
          ...updateData,
          ...(updateData.status === "ACTIVE"
            ? { publishedAt: new Date(), isVerified: true }
            : {}),
        },
        include: {
          images: { orderBy: { order: "asc" } },
          videos: true,
          rentalRooms: { orderBy: { sortOrder: "asc" } },
          amenities: { include: { amenity: true } },
        },
      });
    });

    if (property.status === "SOLD") {
      try {
        const { syncSalesForProperty } = await import("@/lib/wallet");
        await syncSalesForProperty(prisma, property.id);
      } catch (walletError) {
        console.error("Sale wallet sync failed:", walletError);
      }
    }

    revalidatePropertySlug(property.slug);
    if (existing.slug !== property.slug) {
      revalidatePropertySlug(existing.slug);
    }

    return NextResponse.json({ success: true, data: property });
  } catch (error) {
    console.error("Update property failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to update property",
      },
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
    const ctx = await resolveProfessionalActingContext(session.user.id);

    const existing = await prisma.property.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const isOwner = existing.ownerId === ctx.actingOwnerId;
    if (!isAdmin && !ctx.permissions.manageListings) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    await prisma.property.delete({ where: { id } });
    revalidatePropertySlug(existing.slug);
    return NextResponse.json({ success: true, data: { id } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to delete property" },
      { status: 500 },
    );
  }
}
