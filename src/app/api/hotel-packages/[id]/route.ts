import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!canViewWith(ctx, "manageListings") && session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.hotelPackage.findFirst({
      where: { id, ownerId: ctx.actingOwnerId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = (await req.json()) as {
      title?: string;
      description?: string;
      isActive?: boolean;
      priceFrom?: number | null;
      priceTo?: number | null;
      validUntil?: string | null;
    };

    const pkg = await prisma.hotelPackage.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        ...(body.priceFrom !== undefined ? { priceFrom: body.priceFrom } : {}),
        ...(body.priceTo !== undefined ? { priceTo: body.priceTo } : {}),
        ...(body.validUntil !== undefined
          ? { validUntil: body.validUntil ? new Date(body.validUntil) : null }
          : {}),
      },
    });

    return NextResponse.json({ success: true, data: pkg });
  } catch (error) {
    console.error("Update hotel package error:", error);
    return NextResponse.json({ success: false, error: "Could not update package" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!canViewWith(ctx, "manageListings") && session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.hotelPackage.findFirst({
      where: { id, ownerId: ctx.actingOwnerId },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await prisma.hotelPackage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete hotel package error:", error);
    return NextResponse.json({ success: false, error: "Could not delete package" }, { status: 500 });
  }
}
