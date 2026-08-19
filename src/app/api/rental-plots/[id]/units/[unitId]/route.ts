import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProfessionalActingContext } from "@/lib/account-team";

interface RouteParams {
  params: Promise<{ id: string; unitId: string }>;
}

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "RENTED", "DRAFT", "ARCHIVED", "PENDING"]),
});

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

    const unit = await prisma.property.findFirst({
      where: { id: unitId, rentalPlotId: plotId },
      include: {
        rentalPlot: true,
        agent: { select: { userId: true } },
      },
    });

    if (!unit || !unit.rentalPlot) {
      return NextResponse.json(
        { success: false, error: "Unit not found on this plot" },
        { status: 404 },
      );
    }

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const userId = ctx.actingOwnerId;
    const isOwner =
      unit.ownerId === userId ||
      unit.rentalPlot.ownerId === userId ||
      unit.agent?.userId === userId ||
      session.user.role === "ADMIN";

    if (!isOwner || (ctx.isTeamMember && !ctx.permissions.manageListings && session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const nextStatus = parsed.data.status;

    // Owners can mark vacant/rented/archive; only admin can set ACTIVE from PENDING
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
