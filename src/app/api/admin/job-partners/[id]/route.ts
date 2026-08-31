import { NextResponse } from "next/server";
import { z } from "zod";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { getAdminJobPartnerDetail } from "@/lib/job-partner";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

function isAdmin(session: Session | null) {
  return (
    Boolean(session?.user?.id) &&
    (session?.user?.role === "ADMIN" ||
      isSiteOwnerEmail(session?.user?.email))
  );
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  isActive: z.boolean().optional(),
  bio: z.string().trim().max(500).optional(),
});

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const { id } = await params;
  const detail = await getAdminJobPartnerDetail(id);
  if (!detail) {
    return NextResponse.json(
      { success: false, error: "Job partner not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: detail });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!isAdmin(session)) {
    return NextResponse.json(
      { success: false, error: "Admin access required" },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (id === session!.user!.id) {
    return NextResponse.json(
      { success: false, error: "You cannot modify your own account here" },
      { status: 400 },
    );
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success || Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { success: false, error: "Provide isActive and/or bio" },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, jobPartnerProfile: true },
  });
  if (!existing || existing.role !== "JOB_PARTNER") {
    return NextResponse.json(
      { success: false, error: "Job partner not found" },
      { status: 404 },
    );
  }

  const { isActive, bio } = parsed.data;

  await prisma.$transaction(async (tx) => {
    if (typeof isActive === "boolean") {
      await tx.user.update({
        where: { id },
        data: { isActive },
      });
    }
    if (bio !== undefined && existing.jobPartnerProfile) {
      await tx.jobPartnerProfile.update({
        where: { userId: id },
        data: { bio: bio || null },
      });
    }
  });

  if (typeof isActive === "boolean") {
    try {
      await prisma.notification.create({
        data: {
          userId: id,
          type: "SYSTEM",
          title: isActive ? "Account reactivated" : "Account suspended",
          body: isActive
            ? "Your job partner account is active again. You can share your referral link and request payouts."
            : "Your job partner account was suspended by admin. Contact support if you think this is a mistake.",
          link: "/dashboard/jobs",
        },
      });
    } catch (error) {
      console.error("Notify job partner of suspension failed:", error);
    }
  }

  const detail = await getAdminJobPartnerDetail(id);
  return NextResponse.json({ success: true, data: detail });
}
