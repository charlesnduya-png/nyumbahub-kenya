import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveProfessionalActingContext } from "@/lib/account-team";

const patchSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "WITHDRAWN"]),
});

interface RouteParams {
  params: Promise<{ id: string }>;
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

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const hostUserId = ctx.actingOwnerId;
    const isAdmin = session.user.role === "ADMIN";

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid update" },
        { status: 400 },
      );
    }

    const offer = await prisma.propertyOffer.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            agentId: true,
            agent: { select: { userId: true } },
          },
        },
        buyer: { select: { id: true, name: true } },
      },
    });

    if (!offer) {
      return NextResponse.json(
        { success: false, error: "Offer not found" },
        { status: 404 },
      );
    }

    const userId = session.user.id;
    const isBuyer = offer.buyerId === userId;
    const isHost =
      offer.property.ownerId === hostUserId ||
      offer.property.agent?.userId === hostUserId;

    const { status } = parsed.data;

    if (status === "WITHDRAWN") {
      if (!isBuyer && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Only the buyer can withdraw an offer" },
          { status: 403 },
        );
      }
      if (offer.status !== "PENDING") {
        return NextResponse.json(
          { success: false, error: "Only pending offers can be withdrawn" },
          { status: 400 },
        );
      }
    } else if (!isHost && !isAdmin) {
      return NextResponse.json(
        { success: false, error: "Only the listing owner can respond" },
        { status: 403 },
      );
    }

    if (isHost && !isAdmin && !ctx.permissions.manageOffers) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json(
        { success: false, error: "This offer has already been handled" },
        { status: 400 },
      );
    }

    const updated = await prisma.propertyOffer.update({
      where: { id },
      data: { status },
    });

    try {
      const { syncSaleWallet } = await import("@/lib/wallet");
      await syncSaleWallet(prisma, updated.id);
    } catch (walletError) {
      console.error("Offer wallet sync failed:", walletError);
    }

    if (status === "ACCEPTED" || status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: offer.buyerId,
          type: "OFFER",
          title:
            status === "ACCEPTED"
              ? "Your offer was accepted"
              : "Your offer was declined",
          body: `Your offer on ${offer.property.title} was ${status === "ACCEPTED" ? "accepted" : "declined"}.`,
          link: "/dashboard/tenant/offers",
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update offer" },
      { status: 500 },
    );
  }
}
