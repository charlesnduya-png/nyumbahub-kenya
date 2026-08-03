import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { filterMockProperties } from "@/data/mock";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
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

    const filters = parsed.data;
    const skip = (filters.page - 1) * filters.limit;

    try {
      const where = {
        status: "ACTIVE" as const,
        ...(filters.listingType ? { listingType: filters.listingType } : {}),
        ...(filters.propertyType ? { propertyType: filters.propertyType } : {}),
        ...(filters.county
          ? { county: { contains: filters.county, mode: "insensitive" as const } }
          : {}),
        ...(filters.town
          ? { town: { contains: filters.town, mode: "insensitive" as const } }
          : {}),
        ...(filters.minPrice != null ? { price: { gte: filters.minPrice } } : {}),
        ...(filters.maxPrice != null ? { price: { lte: filters.maxPrice } } : {}),
        ...(filters.bedrooms != null ? { bedrooms: { gte: filters.bedrooms } } : {}),
        ...(filters.bathrooms != null
          ? { bathrooms: { gte: filters.bathrooms } }
          : {}),
        ...(filters.furnished != null ? { furnished: filters.furnished } : {}),
        ...(filters.swimmingPool != null
          ? { swimmingPool: filters.swimmingPool }
          : {}),
        ...(filters.security != null ? { security: filters.security } : {}),
      };

      const [properties, total] = await Promise.all([
        prisma.property.findMany({
          where,
          skip,
          take: filters.limit,
          orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        }),
        prisma.property.count({ where }),
      ]);

      const totalPages = Math.ceil(total / filters.limit);

      return NextResponse.json({
        success: true,
        data: properties,
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages,
        hasMore: filters.page < totalPages,
      });
    } catch {
      const fallback = filterMockProperties(filters);
      return NextResponse.json({ success: true, ...fallback, fallback: true });
    }
  } catch {
    const fallback = filterMockProperties({ page: 1, limit: 20 });
    return NextResponse.json({ success: true, ...fallback, fallback: true });
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

    const role = session.user.role;
    if (!role || !["SELLER", "AGENT", "ADMIN"].includes(role)) {
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
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const submitForReview = body.submitForReview !== false;
    const paymentId = typeof body.paymentId === "string" ? body.paymentId : null;
    const productId =
      typeof body.productId === "string" ? body.productId : "standard";

    const { getPayment } = await import("@/lib/payments-store");
    const { getProduct } = await import("@/lib/pricing");
    const product = getProduct(productId);
    const payment = paymentId ? getPayment(paymentId) : null;

    if (submitForReview) {
      if (!payment || payment.status !== "COMPLETED") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Pay for a listing plan before submitting for admin approval.",
            code: "PAYMENT_REQUIRED",
          },
          { status: 402 },
        );
      }
      if (payment.userId !== session.user.id) {
        return NextResponse.json(
          { success: false, error: "Payment does not belong to this account" },
          { status: 403 },
        );
      }
    }

    const status = submitForReview ? "PENDING" : "DRAFT";
    const flags = product?.listingFlags ?? {};
    const baseSlug = slugify(data.title);
    let slug = baseSlug;
    let suffix = 1;

    try {
      while (await prisma.property.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${suffix++}`;
      }

      const images = data.images ?? [];
      const hasPrimary = images.some((img) => img.isPrimary);

      const property = await prisma.property.create({
        data: {
          title: data.title,
          slug,
          description: data.description,
          listingType: data.listingType,
          propertyType: data.propertyType,
          price: data.price,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          county: data.county,
          town: data.town,
          estate: data.estate,
          parkingSpaces: data.parkingSpaces,
          furnished: data.furnished,
          swimmingPool: data.swimmingPool,
          security: data.security,
          floorArea: data.floorArea,
          plotSize: data.plotSize,
          yearBuilt: data.yearBuilt,
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          ownerId: session.user.id,
          status,
          isFeatured: Boolean(flags.isFeatured),
          isPremium: Boolean(flags.isPremium),
          isSponsored: Boolean(flags.isSponsored),
          expiresAt: new Date(
            Date.now() + (product?.durationDays ?? 30) * 86400000,
          ),
          images:
            images.length > 0
              ? {
                  create: images.map((img, index) => ({
                    url: img.url,
                    publicId: img.publicId ?? null,
                    alt: img.alt ?? data.title,
                    order: img.order ?? index,
                    isPrimary: hasPrimary ? Boolean(img.isPrimary) : index === 0,
                  })),
                }
              : undefined,
        },
        include: { images: true },
      });

      return NextResponse.json(
        {
          success: true,
          data: property,
          message:
            status === "PENDING"
              ? "Payment received. Listing submitted for admin approval."
              : "Listing saved as draft",
        },
        { status: 201 },
      );
    } catch {
      const { addDemoListing } = await import("@/lib/listings-store");
      const demo = addDemoListing({
        title: data.title,
        description: data.description,
        listingType: data.listingType,
        propertyType: data.propertyType,
        price: data.price,
        currency: "KES",
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        county: data.county,
        town: data.town,
        estate: data.estate,
        status: status as "PENDING" | "DRAFT",
        ownerId: session.user.id,
        ownerName: session.user.name,
        ownerEmail: session.user.email,
        slug: baseSlug,
        images: (data.images ?? []).map((img, index) => ({
          url: img.url,
          publicId: img.publicId,
          alt: img.alt ?? data.title,
          isPrimary: img.isPrimary ?? index === 0,
          order: img.order ?? index,
        })),
      });

      return NextResponse.json(
        {
          success: true,
          data: demo,
          source: "demo",
          message:
            status === "PENDING"
              ? "Payment received. Listing submitted for admin approval."
              : "Listing saved as draft",
        },
        { status: 201 },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to create property" },
      { status: 500 },
    );
  }
}
