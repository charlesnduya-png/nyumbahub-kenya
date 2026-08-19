import { NextResponse } from "next/server";
import { z } from "zod";

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

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["BUYER", "SELLER", "AGENT", "ADMIN"]).optional(),
  nationalIdVerified: z
    .enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"])
    .optional(),
  verificationStatus: z
    .enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"])
    .optional(),
  isVerified: z.boolean().optional(),
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

    if (id === session!.user!.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot change your own admin account here",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Provide isActive, role, and/or verification fields",
        },
        { status: 400 },
      );
    }

    const {
      isActive,
      role,
      nationalIdVerified,
      verificationStatus,
      isVerified,
    } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { id },
      include: { agentProfile: true },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const nextStatus =
      typeof isVerified === "boolean"
        ? isVerified
          ? "VERIFIED"
          : "PENDING"
        : verificationStatus;

    const user = await prisma.$transaction(async (tx) => {
      const nextUser = await tx.user.update({
        where: { id },
        data: {
          ...(typeof isActive === "boolean" ? { isActive } : {}),
          ...(role ? { role } : {}),
          ...(nationalIdVerified ? { nationalIdVerified } : {}),
          ...(nextStatus
            ? {
                verificationStatus: nextStatus,
                ...(nextStatus === "VERIFIED"
                  ? { nationalIdVerified: "VERIFIED" as const }
                  : {}),
              }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          image: true,
          nationalId: true,
          nationalIdVerified: true,
          verificationStatus: true,
        },
      });

      if (typeof isVerified === "boolean" && existing.role === "AGENT") {
        if (existing.agentProfile) {
          await tx.agent.update({
            where: { id: existing.agentProfile.id },
            data: {
              isVerified,
              verificationStatus: isVerified ? "VERIFIED" : "PENDING",
            },
          });
        } else {
          await tx.agent.create({
            data: {
              userId: existing.id,
              agencyName: existing.name
                ? `${existing.name}'s Agency`
                : "Independent",
              county: "Nairobi",
              town: "Nairobi",
              isVerified,
              verificationStatus: isVerified ? "VERIFIED" : "PENDING",
            },
          });
        }
      }

      return nextUser;
    });

    if (nextStatus === "VERIFIED" || isVerified === true) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: existing.role === "AGENT" ? "Verified badge approved" : "Account verified",
          body:
            existing.role === "AGENT"
              ? "Your agent account now shows a Verified badge on Your Home."
              : "Your landlord account is now verified on Your Home.",
          link: "/dashboard/pro",
        },
      });
    } else if (isVerified === false || nextStatus === "PENDING") {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "SYSTEM",
          title: "Verification updated",
          body: "Your verification status was updated by an admin.",
          link: "/dashboard/pro",
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        name: user.name ?? "—",
        phone: user.phone ?? "—",
        createdAt: user.createdAt.toISOString(),
        hasAgentProfile: user.role === "AGENT",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update user" },
      { status: 500 },
    );
  }
}
