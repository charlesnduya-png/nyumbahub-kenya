import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";

const STATUSES = ["NEW", "REVIEWING", "QUOTED", "CONFIRMED", "DECLINED", "CANCELLED"] as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const canManage =
    session.user.role === "ADMIN" ||
    canViewWith(ctx, "manageBookings") ||
    canViewWith(ctx, "manageListings");

  if (!canManage) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN";

  try {
    const existing = await prisma.hotelServiceRequest.findFirst({
      where: isAdmin ? { id } : { id, ownerId: ctx.actingOwnerId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      status?: (typeof STATUSES)[number];
      ownerNote?: string | null;
      quotedAmount?: number | null;
    };

    if (body.status && !STATUSES.includes(body.status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
    }

    const updated = await prisma.hotelServiceRequest.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.ownerNote !== undefined ? { ownerNote: body.ownerNote?.trim() || null } : {}),
        ...(body.quotedAmount !== undefined ? { quotedAmount: body.quotedAmount } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update hotel request error:", error);
    return NextResponse.json({ success: false, error: "Could not update request" }, { status: 500 });
  }
}
