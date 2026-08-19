import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

import type { Session } from "next-auth";

function isAdminSession(session: Session | null) {
  return (
    Boolean(session?.user?.id) &&
    (session?.user?.role === "ADMIN" ||
      isSiteOwnerEmail(session?.user?.email))
  );
}

export async function GET() {
  try {
    const session = await auth();

    if (!isAdminSession(session)) {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const agentUsers = await prisma.user.findMany({
      where: { role: "AGENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        phone: true,
        nationalId: true,
        nationalIdVerified: true,
        verificationStatus: true,
        createdAt: true,
        agentProfile: {
          select: {
            id: true,
            agencyName: true,
            licenseNumber: true,
            county: true,
            rating: true,
            reviewCount: true,
            isFeatured: true,
            isVerified: true,
            verificationStatus: true,
            _count: { select: { listings: true } },
          },
        },
        _count: { select: { properties: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: agentUsers.map((u) => {
        const profile = u.agentProfile;
        const listingsCount =
          (profile?._count.listings ?? 0) + u._count.properties;
        return {
          id: profile?.id ?? u.id,
          userId: u.id,
          hasAgentProfile: Boolean(profile),
          name: u.name ?? "Agent",
          email: u.email,
          phone: u.phone ?? "—",
          nationalId: u.nationalId ?? null,
          nationalIdVerified: u.nationalIdVerified,
          agency: profile?.agencyName ?? "Independent",
          licenseNumber: profile?.licenseNumber ?? null,
          county: profile?.county ?? "—",
          rating: profile?.rating ?? 0,
          reviewCount: profile?.reviewCount ?? 0,
          listingsCount,
          image: u.image,
          isFeatured: profile?.isFeatured ?? false,
          isVerified: profile?.isVerified ?? false,
          verificationStatus:
            profile?.verificationStatus ?? u.verificationStatus,
          slug: profile?.id ?? u.id,
          createdAt: u.createdAt.toISOString(),
        };
      }),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load agents" },
      { status: 500 },
    );
  }
}
