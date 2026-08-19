import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRentalPlotSchema } from "@/lib/validations/rental-plot";
import {
  canViewPlots,
  canManagePlots,
  hasProfessionalWorkspaceAccess,
  resolveProfessionalActingContext,
} from "@/lib/account-team";

async function requirePlotWorkspace() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 }) };
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!hasProfessionalWorkspaceAccess(ctx) && session.user.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, error: "Only landlords and agents can manage plots" },
        { status: 403 },
      ),
    };
  }

  return { session, ctx };
}

export async function GET() {
  try {
    const gate = await requirePlotWorkspace();
    if ("error" in gate && gate.error) return gate.error;
    const ctx = gate.ctx!;

    if (!canViewPlots(ctx) && gate.session!.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const userId = ctx.actingOwnerId;

    const agent = await prisma.agent.findUnique({
      where: { userId },
      select: { id: true },
    });

    const plots = await prisma.rentalPlot.findMany({
      where: {
        OR: [
          { ownerId: userId },
          ...(agent ? [{ agentId: agent.id }] : []),
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        units: {
          select: {
            id: true,
            title: true,
            slug: true,
            unitLabel: true,
            unitFloor: true,
            price: true,
            currency: true,
            bedrooms: true,
            bathrooms: true,
            status: true,
            propertyType: true,
            listingType: true,
            images: {
              orderBy: { order: "asc" },
              take: 1,
              select: { url: true, alt: true },
            },
            rentalRooms: {
              select: { id: true, status: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      canInviteManager: ctx.permissions.manageTeam,
      canViewRent: ctx.permissions.manageListings,
      canManagePlots: canManagePlots(ctx),
      data: plots.map((plot) => {
        let vacantHouses = 0;
        let rentedHouses = 0;
        let totalHouses = 0;

        for (const unit of plot.units) {
          if (unit.rentalRooms.length > 0) {
            const available = unit.rentalRooms.filter((room) => room.status === "AVAILABLE").length;
            vacantHouses += available;
            rentedHouses += unit.rentalRooms.length - available;
            totalHouses += unit.rentalRooms.length;
          } else if (unit.status === "ACTIVE" && unit.listingType === "RENT") {
            vacantHouses += 1;
            totalHouses += 1;
          } else if (unit.status === "RENTED") {
            rentedHouses += 1;
            totalHouses += 1;
          } else {
            totalHouses += 1;
          }
        }

        const pending = plot.units.filter((u) => u.status === "PENDING");

        return {
          id: plot.id,
          name: plot.name,
          description: plot.description,
          county: plot.county,
          town: plot.town,
          estate: plot.estate,
          address: plot.address,
          latitude: plot.latitude,
          longitude: plot.longitude,
          createdAt: plot.createdAt.toISOString(),
          updatedAt: plot.updatedAt.toISOString(),
          counts: {
            total: totalHouses,
            vacant: vacantHouses,
            rented: rentedHouses,
            pending: pending.length,
          },
          units: plot.units.map((u) => {
            const rooms = u.rentalRooms;
            const housesTotal = rooms.length > 0 ? rooms.length : 1;
            const housesAvailable =
              rooms.length > 0
                ? rooms.filter((room) => room.status === "AVAILABLE").length
                : u.status === "ACTIVE" && u.listingType === "RENT"
                  ? 1
                  : 0;

            return {
              id: u.id,
              title: u.title,
              slug: u.slug,
              unitLabel: u.unitLabel,
              unitFloor: u.unitFloor,
              price: u.price,
              currency: u.currency,
              bedrooms: u.bedrooms,
              bathrooms: u.bathrooms,
              status: u.status,
              propertyType: u.propertyType,
              listingType: u.listingType,
              images: u.images,
              housesTotal,
              housesAvailable,
              housesRented: housesTotal - housesAvailable,
              isVacant: housesAvailable > 0,
            };
          }),
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load plots" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const gate = await requirePlotWorkspace();
    if ("error" in gate && gate.error) return gate.error;
    const session = gate.session!;
    const ctx = gate.ctx!;

    if (!canManagePlots(ctx) && session.user.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = createRentalPlotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid plot details", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: ctx.actingOwnerId },
      select: { id: true },
    });

    const plot = await prisma.rentalPlot.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? null,
        county: parsed.data.county,
        town: parsed.data.town,
        estate: parsed.data.estate ?? null,
        address: parsed.data.address ?? null,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
        ownerId: ctx.actingOwnerId,
        agentId: agent?.id ?? null,
      },
    });

    return NextResponse.json(
      { success: true, data: plot, message: "Plot created" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to create plot" },
      { status: 500 },
    );
  }
}
