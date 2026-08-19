import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManagePlots, resolveProfessionalActingContext } from "@/lib/account-team";
import { resolveListingImagesForStorage } from "@/lib/media-assets";
import { revalidatePropertySlug } from "@/lib/properties";
import { syncPropertyAvailabilityFromRooms } from "@/lib/rental-rooms";
import { updatePlotUnitSchema } from "@/lib/validations/rental-plot";

interface RouteParams {
  params: Promise<{ id: string; unitId: string }>;
}

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "RENTED", "DRAFT", "ARCHIVED", "PENDING"]),
});

async function loadWritableUnit(
  plotId: string,
  unitId: string,
  userId: string,
  sessionRole?: string | null,
) {
  const ctx = await resolveProfessionalActingContext(userId);
  const actorId = ctx.actingOwnerId;

  const unit = await prisma.property.findFirst({
    where: { id: unitId, rentalPlotId: plotId },
    include: {
      rentalPlot: true,
      agent: { select: { userId: true } },
      rentalRooms: { select: { id: true, status: true, sortOrder: true } },
      images: { orderBy: { order: "asc" as const } },
    },
  });

  if (!unit || !unit.rentalPlot) {
    return { error: "Unit not found on this plot" as const, status: 404 as const };
  }

  const isOwner =
    unit.ownerId === actorId ||
    unit.rentalPlot.ownerId === actorId ||
    unit.agent?.userId === actorId ||
    sessionRole === "ADMIN";

  if (!isOwner || (ctx.isTeamMember && !canManagePlots(ctx) && sessionRole !== "ADMIN")) {
    return { error: "Forbidden" as const, status: 403 as const };
  }

  return { unit, ctx };
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

    const { id: plotId, unitId } = await params;
    const loaded = await loadWritableUnit(
      plotId,
      unitId,
      session.user.id,
      session.user.role,
    );
    if ("error" in loaded) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: loaded.status },
      );
    }

    const { unit } = loaded;
    const rooms = unit.rentalRooms;
    const housesTotal = rooms.length > 0 ? rooms.length : 1;
    const housesAvailable =
      rooms.length > 0
        ? rooms.filter((room) => room.status === "AVAILABLE").length
        : unit.status === "ACTIVE"
          ? 1
          : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: unit.id,
        unitLabel: unit.unitLabel,
        unitFloor: unit.unitFloor,
        propertyType: unit.propertyType,
        price: unit.price,
        bedrooms: unit.bedrooms,
        bathrooms: unit.bathrooms,
        furnished: unit.furnished,
        description: unit.description,
        status: unit.status,
        housesTotal,
        housesAvailable,
        housesRented: housesTotal - housesAvailable,
        images: unit.images.map((img) => ({
          url: img.url,
          publicId: img.publicId,
          alt: img.alt,
          isPrimary: img.isPrimary,
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load unit" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const { id: plotId, unitId } = await params;
    const loaded = await loadWritableUnit(
      plotId,
      unitId,
      session.user.id,
      session.user.role,
    );
    if ("error" in loaded) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: loaded.status },
      );
    }

    const body = await request.json();
    const parsed = updatePlotUnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Invalid listing details",
        },
        { status: 400 },
      );
    }

    const { unit } = loaded;
    const plot = unit.rentalPlot;
    if (!plot) {
      return NextResponse.json(
        { success: false, error: "Unit not found on this plot" },
        { status: 404 },
      );
    }
    const unitLabel = parsed.data.unitLabel;
    const unitFloor = parsed.data.unitFloor;
    const housesAvailable = parsed.data.housesAvailable;
    const nextPrice = parsed.data.price;

    const title =
      parsed.data.title?.trim() ||
      (housesAvailable > 1
        ? `${housesAvailable} ${unitLabel} units, ${unitFloor} — ${plot.name}, ${plot.town}`
        : `${unitLabel}, ${unitFloor} — ${plot.name}, ${plot.town}`);
    const description =
      parsed.data.description?.trim() ||
      unit.description ||
      `${housesAvailable} vacant ${parsed.data.propertyType.toLowerCase()}${housesAvailable === 1 ? "" : "s"} (${unitLabel}, ${unitFloor}) available for rent at ${plot.name} in ${plot.town}, ${plot.county}.`;

    const images = parsed.data.images;
    const hasPrimary = images.some((img) => img.isPrimary);
    const resolvedImages = await resolveListingImagesForStorage(images);

    await prisma.$transaction(async (tx) => {
      await tx.property.update({
        where: { id: unitId },
        data: {
          title,
          description,
          propertyType: parsed.data.propertyType,
          price: nextPrice,
          bedrooms: parsed.data.bedrooms ?? null,
          bathrooms: parsed.data.bathrooms ?? null,
          furnished: parsed.data.furnished ?? false,
          parkingSpaces: parsed.data.parkingSpaces ?? unit.parkingSpaces,
          unitLabel,
          unitFloor,
        },
      });

      await tx.propertyImage.deleteMany({ where: { propertyId: unitId } });
      await tx.propertyImage.createMany({
        data: resolvedImages.map((img, index) => ({
          propertyId: unitId,
          url: img.url,
          publicId: img.publicId ?? null,
          alt: img.alt ?? `${unitLabel} at ${plot.name}`,
          order: img.order ?? index,
          isPrimary: hasPrimary ? Boolean(images[index]?.isPrimary) : index === 0,
        })),
      });

      let rooms = [...unit.rentalRooms].sort((a, b) => a.sortOrder - b.sortOrder);
      if (rooms.length === 0) {
        await tx.propertyRentalRoom.create({
          data: {
            propertyId: unitId,
            label: unitLabel,
            floor: unitFloor,
            price: nextPrice,
            sortOrder: 0,
            status: unit.status === "RENTED" ? "RENTED" : "AVAILABLE",
          },
        });
        rooms = await tx.propertyRentalRoom.findMany({
          where: { propertyId: unitId },
          select: { id: true, status: true, sortOrder: true },
        });
      }

      const rentedCount = rooms.filter((room) => room.status === "RENTED").length;
      if (housesAvailable < rentedCount) {
        throw new Error(
          `Cannot set total to ${housesAvailable}. ${rentedCount} house(s) are already rented.`,
        );
      }

      if (housesAvailable > rooms.length) {
        const extra = housesAvailable - rooms.length;
        const start = rooms.length;
        await tx.propertyRentalRoom.createMany({
          data: Array.from({ length: extra }, (_, index) => ({
            propertyId: unitId,
            label:
              housesAvailable > 1
                ? `${unitLabel} ${start + index + 1}`
                : unitLabel,
            floor: unitFloor,
            price: nextPrice,
            sortOrder: start + index,
            status: "AVAILABLE" as const,
          })),
        });
      } else if (housesAvailable < rooms.length) {
        const toRemove = rooms.length - housesAvailable;
        const removable = rooms
          .filter((room) => room.status === "AVAILABLE")
          .slice(-toRemove);
        if (removable.length < toRemove) {
          throw new Error(
            `Cannot set total to ${housesAvailable}. ${rentedCount} house(s) are already rented.`,
          );
        }
        await tx.propertyRentalRoom.deleteMany({
          where: { id: { in: removable.map((room) => room.id) } },
        });
      }

      await tx.propertyRentalRoom.updateMany({
        where: { propertyId: unitId },
        data: { floor: unitFloor, price: nextPrice },
      });

      if (unit.status !== "PENDING") {
        await syncPropertyAvailabilityFromRooms(tx, unitId);
      }
    });

    revalidatePropertySlug(unit.slug);

    return NextResponse.json({
      success: true,
      message: "Listing updated",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update listing";
    const clientError =
      message.startsWith("Cannot set total") ||
      message.includes("Image reference");
    return NextResponse.json(
      { success: false, error: message },
      { status: clientError ? 400 : 500 },
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

    const { id: plotId, unitId } = await params;
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status" },
        { status: 400 },
      );
    }

    const loaded = await loadWritableUnit(
      plotId,
      unitId,
      session.user.id,
      session.user.role,
    );
    if ("error" in loaded) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: loaded.status },
      );
    }

    const { unit } = loaded;
    const nextStatus = parsed.data.status;

    if (
      nextStatus === "ACTIVE" &&
      unit.status === "PENDING" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Admin must approve pending units before they go live",
        },
        { status: 403 },
      );
    }

    const rooms = unit.rentalRooms;
    const hasRooms = rooms.length > 0;

    if (hasRooms && nextStatus === "RENTED") {
      if (unit.status === "PENDING") {
        return NextResponse.json(
          {
            success: false,
            error: "Wait for admin approval before marking houses rented",
          },
          { status: 403 },
        );
      }
      const available = rooms.find((room) => room.status === "AVAILABLE");
      if (!available) {
        return NextResponse.json(
          { success: false, error: "No vacant houses left in this listing" },
          { status: 400 },
        );
      }

      const sync = await prisma.$transaction(async (tx) => {
        await tx.propertyRentalRoom.update({
          where: { id: available.id },
          data: { status: "RENTED" },
        });
        return syncPropertyAvailabilityFromRooms(tx, unitId);
      });
      revalidatePropertySlug(unit.slug);

      return NextResponse.json({
        success: true,
        data: { id: unitId, status: sync.propertyStatus },
        message:
          sync.availableCount > 0
            ? `One house marked rented. ${sync.availableCount} of ${sync.totalCount} still vacant.`
            : "Last house rented — listing removed from the rent page",
      });
    }

    if (hasRooms && nextStatus === "ACTIVE" && unit.status !== "PENDING") {
      const rented = rooms.find((room) => room.status === "RENTED");
      if (!rented) {
        return NextResponse.json(
          { success: false, error: "All houses in this listing are already vacant" },
          { status: 400 },
        );
      }

      const sync = await prisma.$transaction(async (tx) => {
        await tx.propertyRentalRoom.update({
          where: { id: rented.id },
          data: { status: "AVAILABLE" },
        });
        return syncPropertyAvailabilityFromRooms(tx, unitId);
      });
      revalidatePropertySlug(unit.slug);

      return NextResponse.json({
        success: true,
        data: { id: unitId, status: sync.propertyStatus },
        message: `One house marked vacant. ${sync.availableCount} of ${sync.totalCount} now available.`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const property = await tx.property.update({
        where: { id: unitId },
        data: {
          status: nextStatus,
          ...(nextStatus === "ACTIVE"
            ? { publishedAt: new Date(), isVerified: true }
            : {}),
        },
      });

      if (nextStatus === "RENTED") {
        await tx.rentalReservation.updateMany({
          where: {
            propertyId: unitId,
            status: { in: ["PENDING", "APPROVED"] },
          },
          data: { status: "RENTED" },
        });
      }

      if (nextStatus === "ACTIVE" && unit.status === "RENTED") {
        await tx.rentalReservation.updateMany({
          where: { propertyId: unitId, status: "RENTED" },
          data: { status: "CANCELLED" },
        });
      }

      return property;
    });
    revalidatePropertySlug(unit.slug);

    const message =
      nextStatus === "RENTED"
        ? "Marked as rented — removed from the rent page"
        : nextStatus === "ACTIVE"
          ? "Unit marked vacant and listed for rent"
          : "Unit status updated";

    return NextResponse.json({ success: true, data: updated, message });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update unit" },
      { status: 500 },
    );
  }
}
