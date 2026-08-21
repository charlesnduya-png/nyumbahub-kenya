import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import {
  createPlotUnitSchema,
  updateRentalPlotSchema,
} from "@/lib/validations/rental-plot";
import {
  assertCanCreateListing,
} from "@/lib/listing-subscription";
import {
  canManagePlots,
  canViewPlots,
  resolveProfessionalActingContext,
} from "@/lib/account-team";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getPlotActor(userId: string, role?: string | null) {
  const ctx = await resolveProfessionalActingContext(userId);
  return {
    ctx,
    actorId: ctx.actingOwnerId,
    actorRole: ctx.actingOwnerRole ?? role,
  };
}

async function requireOwnedPlot(
  plotId: string,
  userId: string,
  sessionRole?: string | null,
  write = false,
) {
  const { ctx, actorId, actorRole } = await getPlotActor(userId, sessionRole);
  const allowed =
    sessionRole === "ADMIN" ||
    (write ? canManagePlots(ctx) : canViewPlots(ctx));
  if (!allowed) {
    return { error: "Forbidden" as const, status: 403 as const };
  }
  const owned = await getOwnedPlot(plotId, actorId, actorRole);
  if ("error" in owned) return owned;
  return { ...owned, ctx, actorId, actorRole };
}

async function getOwnedPlot(plotId: string, userId: string, role?: string | null) {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    select: { id: true },
  });

  const plot = await prisma.rentalPlot.findUnique({ where: { id: plotId } });
  if (!plot) return { error: "Plot not found" as const, status: 404 as const };

  const allowed =
    role === "ADMIN" ||
    plot.ownerId === userId ||
    (agent && plot.agentId === agent.id);

  if (!allowed) {
    return { error: "Forbidden" as const, status: 403 as const };
  }

  return { plot, agent };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const owned = await requireOwnedPlot(id, session.user.id, session.user.role);
    if ("error" in owned && owned.error) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status },
      );
    }

    const plot = await prisma.rentalPlot.findUnique({
      where: { id },
      include: {
        units: {
          orderBy: { createdAt: "desc" },
          include: {
            images: { orderBy: { order: "asc" }, take: 1 },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: plot });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load plot" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const owned = await requireOwnedPlot(id, session.user.id, session.user.role, true);
    if ("error" in owned && owned.error) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status },
      );
    }

    const body = await request.json();
    const parsed = updateRentalPlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update" },
        { status: 400 },
      );
    }

    const updated = await prisma.rentalPlot.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update plot" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const owned = await requireOwnedPlot(id, session.user.id, session.user.role, true);
    if ("error" in owned && owned.error) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status },
      );
    }

    await prisma.rentalPlot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to delete plot" },
      { status: 500 },
    );
  }
}

/** Post a vacant rental unit under this plot */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const { id } = await params;
    const owned = await requireOwnedPlot(id, session.user.id, session.user.role, true);
    if ("error" in owned && owned.error) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status },
      );
    }

    const plot = owned.plot!;
    const actorId = "actorId" in owned ? owned.actorId : session.user.id;
    const role =
      ("actorRole" in owned ? owned.actorRole : session.user.role) ??
      session.user.role;
    const body = await request.json();
    const parsed = createPlotUnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid unit details",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const submitForReview = parsed.data.submitForReview !== false;

    const canCreate = await assertCanCreateListing({
      userId: actorId,
      role,
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

    // Free tier / paid plan limits already enforced by assertCanCreateListing above.

    const unitLabel = parsed.data.unitLabel;
    const unitFloor = parsed.data.unitFloor;
    const images = parsed.data.images;
    const hasPrimary = images.some((img) => img.isPrimary);
    const housesAvailable = parsed.data.housesAvailable;

    const title =
      parsed.data.title?.trim() ||
      (housesAvailable > 1
        ? `${housesAvailable} ${unitLabel} units, ${unitFloor} — ${plot.name}, ${plot.town}`
        : `${unitLabel}, ${unitFloor} — ${plot.name}, ${plot.town}`);
    const description =
      parsed.data.description?.trim() ||
      `${housesAvailable} vacant ${parsed.data.propertyType.toLowerCase()}${housesAvailable === 1 ? "" : "s"} (${unitLabel}, ${unitFloor}) available for rent at ${plot.name} in ${plot.town}, ${plot.county}.${plot.description ? ` ${plot.description}` : ""}`;

    const baseSlug = slugify(`${title}-${unitLabel}`);
    let slug = baseSlug;
    let suffix = 1;
    while (await prisma.property.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const status = submitForReview ? "PENDING" : "DRAFT";

    const unit = await prisma.property.create({
      data: {
        title,
        slug,
        description,
        listingType: "RENT",
        propertyType: parsed.data.propertyType,
        price: parsed.data.price,
        currency: parsed.data.currency,
        bedrooms: parsed.data.bedrooms ?? null,
        bathrooms: parsed.data.bathrooms ?? null,
        furnished: parsed.data.furnished ?? false,
        parkingSpaces: parsed.data.parkingSpaces ?? 0,
        county: plot.county,
        town: plot.town,
        estate: plot.estate,
        address: plot.address,
        latitude: plot.latitude,
        longitude: plot.longitude,
        ownerId: actorId,
        agentId: owned.agent?.id ?? plot.agentId,
        rentalPlotId: plot.id,
        unitLabel,
        unitFloor,
        status,
        publishedAt: null,
        images: {
          create: images.map((img, index) => ({
            url: img.url,
            publicId: img.publicId ?? null,
            alt: img.alt ?? `${unitLabel} at ${plot.name}`,
            order: img.order ?? index,
            isPrimary: hasPrimary ? Boolean(img.isPrimary) : index === 0,
          })),
        },
        rentalRooms: {
          create: Array.from({ length: housesAvailable }, (_, index) => ({
            label:
              housesAvailable > 1 ? `${unitLabel} ${index + 1}` : unitLabel,
            floor: unitFloor,
            price: parsed.data.price,
            sortOrder: index,
            status: "AVAILABLE" as const,
          })),
        },
      },
      include: {
        images: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: unit,
        message:
          status === "PENDING"
            ? housesAvailable > 1
              ? `${housesAvailable} houses submitted for admin approval. Each booking will deduct one until none are left.`
              : "Vacant unit submitted for admin approval"
            : housesAvailable > 1
              ? `${housesAvailable} houses saved as draft`
              : "Vacant unit saved as draft",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to add vacant unit" },
      { status: 500 },
    );
  }
}
