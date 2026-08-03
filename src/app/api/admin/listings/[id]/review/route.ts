import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { updateDemoListingStatus } from "@/lib/listings-store";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const reviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(500).optional(),
});

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid review action" },
        { status: 400 },
      );
    }

    const { action, reason } = parsed.data;
    const nextStatus = action === "approve" ? "ACTIVE" : "REJECTED";

    try {
      const existing = await prisma.property.findUnique({ where: { id } });

      if (!existing) {
        throw new Error("NOT_FOUND_DB");
      }

      if (existing.status !== "PENDING" && existing.status !== "DRAFT") {
        return NextResponse.json(
          { success: false, error: "Only pending listings can be reviewed" },
          { status: 400 },
        );
      }

      const property = await prisma.property.update({
        where: { id },
        data: {
          status: nextStatus,
          publishedAt: action === "approve" ? new Date() : null,
          isVerified: action === "approve" ? true : existing.isVerified,
        },
      });

      await prisma.notification.create({
        data: {
          userId: existing.ownerId,
          type: "LISTING",
          title:
            action === "approve"
              ? "Listing approved"
              : "Listing needs changes",
          body:
            action === "approve"
              ? `"${existing.title}" is now live on NyumbaHub.`
              : `"${existing.title}" was rejected.${reason ? ` Reason: ${reason}` : ""}`,
          link: `/dashboard/seller/properties`,
        },
      });

      return NextResponse.json({ success: true, data: property });
    } catch {
      const demo = updateDemoListingStatus(
        id,
        nextStatus,
        action === "reject" ? reason : undefined,
      );

      if (!demo) {
        return NextResponse.json(
          { success: false, error: "Listing not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: demo,
        source: "demo",
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to review listing" },
      { status: 500 },
    );
  }
}
