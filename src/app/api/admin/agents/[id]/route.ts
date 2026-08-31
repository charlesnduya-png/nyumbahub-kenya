import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import { assertCanCreateListing } from "@/lib/listing-subscription";

import type { Session } from "next-auth";

function isAdminSession(session: Session | null) {
  return (
    Boolean(session?.user?.id) &&
    (session?.user?.role === "ADMIN" ||
      isSiteOwnerEmail(session?.user?.email))
  );
}

async function resolveAgentRecord(id: string) {
  const byAgentId = await prisma.agent.findUnique({ where: { id } });
  if (byAgentId) return byAgentId;

  const user = await prisma.user.findUnique({
    where: { id },
    include: { agentProfile: true },
  });

  if (!user || user.role !== "AGENT") {
    return null;
  }

  if (user.agentProfile) {
    return user.agentProfile;
  }

  return prisma.agent.create({
    data: {
      userId: user.id,
      agencyName: user.name ? `${user.name}'s Agency` : "Independent",
      county: "Nairobi",
      town: "Nairobi",
      verificationStatus: "PENDING",
      isVerified: false,
    },
  });
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  isFeatured: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  listingLimitOverride: z.number().int().nullable().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!isAdminSession(session)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide isFeatured, isVerified, and/or listingLimitOverride",
        },
        { status: 400 },
      );
    }

    const { isFeatured, isVerified, listingLimitOverride } = parsed.data;

    const existing = await resolveAgentRecord(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Agent not found" },
        { status: 404 },
      );
    }

    if (typeof listingLimitOverride !== "undefined") {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { listingLimitOverride },
      });
    }

    const agent = await prisma.agent.update({
      where: { id: existing.id },
      data: {
        ...(typeof isFeatured === "boolean" ? { isFeatured } : {}),
        ...(typeof isVerified === "boolean"
          ? {
              isVerified,
              verificationStatus: isVerified ? "VERIFIED" : "PENDING",
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            email: true,
            phone: true,
            nationalId: true,
          },
        },
        _count: { select: { listings: true } },
      },
    });

    if (typeof isVerified === "boolean") {
      await prisma.user.update({
        where: { id: existing.userId },
        data: {
          nationalIdVerified: isVerified ? "VERIFIED" : "PENDING",
          verificationStatus: isVerified ? "VERIFIED" : "PENDING",
        },
      });

      await prisma.notification.create({
        data: {
          userId: existing.userId,
          type: "SYSTEM",
          title: isVerified
            ? "Verified badge approved"
            : "Verification badge removed",
          body: isVerified
            ? "Your agent account now shows a Verified badge on Your Home."
            : "Your Verified badge was removed. Contact support if you need a review.",
          link: "/dashboard/pro",
        },
      });
    }

    const access = await assertCanCreateListing({
      userId: existing.userId,
      role: "AGENT",
    });
    const userRow = await prisma.user.findUnique({
      where: { id: existing.userId },
      select: { listingLimitOverride: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: agent.id,
        userId: existing.userId,
        name: agent.user.name ?? "Agent",
        agency: agent.agencyName ?? "Independent",
        licenseNumber: agent.licenseNumber,
        nationalId: agent.user.nationalId,
        email: agent.user.email,
        phone: agent.user.phone,
        county: agent.county ?? "—",
        rating: agent.rating,
        reviewCount: agent.reviewCount,
        listingsCount: agent._count.listings,
        listingUsed: access.used,
        listingLimit: access.limit,
        listingLimitOverride: userRow?.listingLimitOverride ?? null,
        image: agent.user.image,
        isFeatured: agent.isFeatured,
        isVerified: agent.isVerified,
        verificationStatus: agent.verificationStatus,
        slug: agent.id,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update agent" },
      { status: 500 },
    );
  }
}
