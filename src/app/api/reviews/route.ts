import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";
import { canReviewStay, guestDisplayName } from "@/lib/membership";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import { createReviewSchema } from "@/lib/validations/review";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId")?.trim();
  const mine = searchParams.get("mine") === "1";
  const host = searchParams.get("host") === "1";
  const listingTypeParam = searchParams.get("listingType");
  const listingType =
    listingTypeParam === "HOTEL" || listingTypeParam === "HOLIDAY"
      ? (listingTypeParam as "HOTEL" | "HOLIDAY")
      : undefined;

  const session = await auth();

  try {
    if (host) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Sign in required" },
          { status: 401 },
        );
      }

      const ctx = await resolveProfessionalActingContext(session.user.id);
      const isAdmin =
        session.user.role === "ADMIN" || isSiteOwnerEmail(session.user.email);
      const canHostReviews =
        isAdmin ||
        canViewWith(ctx, "manageBookings") ||
        canViewWith(ctx, "manageListings");

      if (!canHostReviews) {
        return NextResponse.json(
          { success: false, error: "Not allowed" },
          { status: 403 },
        );
      }

      const hostUserId = ctx.actingOwnerId;
      const reviews = await prisma.review.findMany({
        where: {
          property: {
            ...(listingType ? { listingType } : {}),
            ...(isAdmin
              ? {}
              : {
                  OR: [
                    { ownerId: hostUserId },
                    { agent: { userId: hostUserId } },
                  ],
                }),
          },
        },
        include: {
          user: { select: { name: true } },
          property: {
            select: {
              id: true,
              title: true,
              slug: true,
              town: true,
              county: true,
              listingType: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      return NextResponse.json({
        success: true,
        data: reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          cleanliness: review.cleanliness,
          locationScore: review.locationScore,
          value: review.value,
          comfort: review.comfort,
          staff: review.staff,
          liked: review.liked,
          disliked: review.disliked,
          comment: review.comment,
          hostReply: review.hostReply,
          hostRepliedAt: review.hostRepliedAt,
          createdAt: review.createdAt,
          guestName: guestDisplayName(review.user.name),
          property: review.property,
        })),
      });
    }

    if (mine) {
      if (!session?.user?.id) {
        return NextResponse.json(
          { success: false, error: "Sign in required" },
          { status: 401 },
        );
      }
      const reviews = await prisma.review.findMany({
        where: { userId: session.user.id },
        include: {
          property: {
            select: { id: true, title: true, slug: true, town: true, county: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ success: true, data: reviews });
    }

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "propertyId is required" },
        { status: 400 },
      );
    }

    const reviews = await prisma.review.findMany({
      where: {
        OR: [{ propertyId }, { property: { slug: propertyId } }],
      },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const scores = reviews.map((r) => r.rating).filter((n) => n > 0);
    const average =
      scores.length > 0
        ? Math.round((scores.reduce((sum, n) => sum + n, 0) / scores.length) * 10) /
          10
        : 0;

    return NextResponse.json({
      success: true,
      data: reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        cleanliness: review.cleanliness,
        locationScore: review.locationScore,
        value: review.value,
        comfort: review.comfort,
        staff: review.staff,
        liked: review.liked,
        disliked: review.disliked,
        comment: review.comment,
        hostReply: review.hostReply,
        createdAt: review.createdAt,
        guestName: guestDisplayName(review.user.name),
      })),
      average,
      count: reviews.length,
    });
  } catch (error) {
    console.error("List reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load reviews" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in to write a review" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Please score every category from 1 to 10" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findFirst({
      where: {
        id: parsed.data.bookingId,
        guestId: session.user.id,
      },
      include: {
        review: { select: { id: true } },
        property: { select: { id: true, title: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 },
      );
    }

    if (
      !canReviewStay({
        status: booking.status,
        checkOut: booking.checkOut,
        hasReview: Boolean(booking.review),
      })
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You can review after your stay is completed or checkout has passed",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.review.findUnique({
      where: {
        propertyId_userId: {
          propertyId: booking.propertyId,
          userId: session.user.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "You already reviewed this stay" },
        { status: 409 },
      );
    }

    const review = await prisma.review.create({
      data: {
        propertyId: booking.propertyId,
        userId: session.user.id,
        bookingId: booking.id,
        rating: parsed.data.rating,
        cleanliness: parsed.data.cleanliness,
        locationScore: parsed.data.locationScore,
        value: parsed.data.value,
        comfort: parsed.data.comfort,
        staff: parsed.data.staff,
        liked: parsed.data.liked || null,
        disliked: parsed.data.disliked || null,
        comment: parsed.data.comment || null,
      },
    });

    return NextResponse.json(
      { success: true, data: review, message: "Thanks for your review" },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save review" },
      { status: 500 },
    );
  }
}
