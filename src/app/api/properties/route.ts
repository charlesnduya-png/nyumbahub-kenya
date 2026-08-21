import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchProperties } from "@/lib/properties";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { resolveListingImagesForStorage, resolveListingVideosForStorage } from "@/lib/media-assets";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import {
  createPropertySchema,
  propertySearchSchema,
} from "@/lib/validations/property";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = Object.fromEntries(searchParams.entries());
    const parsed = propertySearchSchema.safeParse(raw);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid search parameters" },
        { status: 400 },
      );
    }

    const result = await searchProperties(parsed.data);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch {
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      hasMore: false,
    });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const ctx = await resolveProfessionalActingContext(session.user.id);
    if (!ctx.permissions.manageListings) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const effectiveRole = ctx.actingOwnerRole;
    if (!effectiveRole || !["SELLER", "AGENT", "ADMIN"].includes(effectiveRole)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only professional accounts can list properties. Register as a seller or agent first.",
          code: "PROFESSIONAL_REQUIRED",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createPropertySchema.safeParse(body);

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: firstIssue?.message ?? "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const submitForReview = body.submitForReview !== false;
    const productId =
      typeof body.productId === "string" ? body.productId : "standard";

    if (submitForReview && (!data.images || data.images.length === 0)) {
      return NextResponse.json(
        {
          success: false,
          error: "Add at least one property photo before submitting for approval",
          code: "IMAGES_REQUIRED",
        },
        { status: 400 },
      );
    }

    const { getProduct } = await import("@/lib/pricing");
    const {
      assertCanCreateListing,
      getActiveListingSubscription,
      listingFlagsForPlan,
      listingFlagsForProduct,
    } = await import("@/lib/listing-subscription");

    const canCreate = await assertCanCreateListing({
      userId: ctx.actingOwnerId,
      role: effectiveRole,
    });
    if (!canCreate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: canCreate.error,
          code: canCreate.code,
          used: canCreate.used,
          limit: canCreate.limit,
        },
        { status: canCreate.code === "LISTING_LIMIT_REACHED" ? 403 : 402 },
      );
    }

    let product = getProduct(productId);
    let flags = product?.listingFlags ?? {};
    let activeSubscription: Awaited<
      ReturnType<typeof getActiveListingSubscription>
    > = null;

    if (submitForReview) {
      activeSubscription = await getActiveListingSubscription(ctx.actingOwnerId);
      const paymentId =
        typeof body.paymentId === "string" ? body.paymentId : null;

      if (activeSubscription) {
        flags = {
          ...listingFlagsForPlan(activeSubscription.plan),
          ...(product?.listingFlags ?? {}),
        };
      } else if (productId && paymentId) {
        flags = listingFlagsForProduct(productId);
      } else {
        product = getProduct("standard");
        flags = {};
      }
    }

    const status = submitForReview ? "PENDING" : "DRAFT";
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let suffix = 1;

    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const images = data.images ?? [];
    const videos = data.videos ?? [];
    const hasPrimary = images.some((img) => img.isPrimary);

    let resolvedImages: Awaited<ReturnType<typeof resolveListingImagesForStorage>> =
      [];
    try {
      resolvedImages = images.length > 0 ? await resolveListingImagesForStorage(images) : [];
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "One or more photos could not be saved. Re-upload and try again.",
          code: "IMAGES_INVALID",
        },
        { status: 400 },
      );
    }

    let resolvedVideos: Awaited<ReturnType<typeof resolveListingVideosForStorage>> =
      [];
    try {
      resolvedVideos =
        videos.length > 0 ? await resolveListingVideosForStorage(videos) : [];
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "One or more videos could not be saved. Re-upload and try again.",
          code: "VIDEOS_INVALID",
        },
        { status: 400 },
      );
    }

    const rentalRoomRows =
      data.listingType === "RENT"
        ? (() => {
            if (data.rentalRooms && data.rentalRooms.length > 0) {
              return data.rentalRooms.map((room, index) => ({
                label: room.label,
                floor: room.floor ?? null,
                price: room.price ?? null,
                sortOrder: index,
              }));
            }
            if (data.rentalRoomsCount && data.rentalRoomsCount > 1) {
              return Array.from({ length: data.rentalRoomsCount }, (_, index) => ({
                label: `Room ${index + 1}`,
                floor: null as string | null,
                price: null as number | null,
                sortOrder: index,
              }));
            }
            return [];
          })()
        : [];

    const expiresAt =
      activeSubscription?.endDate ??
      new Date(Date.now() + (product?.durationDays ?? 30) * 86400000);

    let agentId: string | null = null;
    if (effectiveRole === "AGENT") {
      const agent = await prisma.agent.findUnique({
        where: { userId: ctx.actingOwnerId },
        select: { id: true },
      });
      agentId = agent?.id ?? null;
    }

    const property = await prisma.property.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        listingType: data.listingType,
        propertyType: data.propertyType,
        price: data.price,
        currency: data.currency,
        bedrooms: data.bedrooms ?? null,
        bathrooms: data.bathrooms ?? null,
        country: data.country,
        county: data.county,
        town: data.town,
        estate: data.estate ?? null,
        parkingSpaces: data.parkingSpaces,
        furnished: data.furnished,
        swimmingPool: data.swimmingPool,
        security: data.security,
        floorArea: data.floorArea ?? null,
        plotSize: data.plotSize ?? null,
        yearBuilt: data.yearBuilt ?? null,
        address: data.address ?? null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        ownerId: ctx.actingOwnerId,
        agentId,
        status,
        isFeatured: Boolean(flags.isFeatured),
        isPremium: Boolean(flags.isPremium),
        isSponsored: Boolean(flags.isSponsored),
        expiresAt,
        images:
          resolvedImages.length > 0
            ? {
                create: resolvedImages.map((img, index) => ({
                  url: img.url,
                  publicId: img.publicId ?? null,
                  alt: img.alt ?? data.title,
                  order: img.order ?? index,
                  isPrimary: hasPrimary ? Boolean(img.isPrimary) : index === 0,
                })),
              }
            : undefined,
        videos:
          resolvedVideos.length > 0
            ? {
                create: resolvedVideos.map((video) => ({
                  url: video.url,
                  publicId: video.publicId ?? null,
                  title: video.title,
                  thumbnail: video.thumbnail,
                })),
              }
            : undefined,
        rentalRooms:
          rentalRoomRows.length > 0
            ? {
                create: rentalRoomRows,
              }
            : undefined,
      },
      include: { images: true, videos: true, rentalRooms: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: property,
        message:
          status === "PENDING"
            ? "Listing submitted for admin approval."
            : "Listing saved as draft",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create property failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create property",
      },
      { status: 500 },
    );
  }
}
