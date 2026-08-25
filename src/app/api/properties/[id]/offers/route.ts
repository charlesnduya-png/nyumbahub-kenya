import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getPropertyHostUserId } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { isStayListing } from "@/lib/listing-kinds";

const offerSchema = z.object({
  amount: z.coerce.number().positive().max(10_000_000_000),
  currency: z.string().trim().max(10).default("KES"),
  message: z.string().trim().max(2000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in to submit an offer" },
        { status: 401 },
      );
    }

    const { assertTenantContactAccess } = await import("@/lib/tenant-access");
    const access = await assertTenantContactAccess({
      userId: session.user.id,
      role: session.user.role,
    });
    if (!access.ok) {
      return NextResponse.json(
        {
          success: false,
          error: access.error,
          code: access.code,
          productId: access.productId,
          price: access.price,
          hours: access.hours,
        },
        { status: 402 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = offerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid offer",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const hostInfo = await getPropertyHostUserId(id);

    if (!hostInfo) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: hostInfo.propertyId },
      select: {
        id: true,
        title: true,
        status: true,
        listingType: true,
        ownerId: true,
      },
    });

    if (!property || property.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "This property is not available for offers" },
        { status: 400 },
      );
    }

    if (isStayListing(property.listingType)) {
      return NextResponse.json(
        { success: false, error: "Use booking for hotel and BnB stays" },
        { status: 400 },
      );
    }

    if (
      property.ownerId === session.user.id ||
      hostInfo.hostUserId === session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "You cannot offer on your own listing" },
        { status: 400 },
      );
    }

    const offer = await prisma.propertyOffer.create({
      data: {
        propertyId: property.id,
        buyerId: session.user.id,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        message: parsed.data.message?.trim() || null,
      },
    });

    const formatted = parsed.data.amount.toLocaleString("en-KE");
    await prisma.notification.create({
      data: {
        userId: hostInfo.hostUserId,
        type: "OFFER",
        title: "New offer on your listing",
        body: `${session.user.name ?? "A buyer"} offered ${parsed.data.currency} ${formatted} on ${property.title}.`,
        link: "/dashboard/pro/offers",
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: offer,
        message: "Offer sent to the owner.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to submit offer" },
      { status: 500 },
    );
  }
}
