import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { prisma } from "@/lib/prisma";
import { hostReplySchema } from "@/lib/validations/review";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const ctx = await resolveProfessionalActingContext(session.user.id);
  const hostUserId = ctx.actingOwnerId;

  try {
    const body = await request.json();
    const parsed = hostReplySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Enter a reply" },
        { status: 400 },
      );
    }

    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            ownerId: true,
            agent: { select: { userId: true } },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { success: false, error: "Review not found" },
        { status: 404 },
      );
    }

    const isHost =
      session.user.role === "ADMIN" ||
      review.property.ownerId === hostUserId ||
      review.property.agent?.userId === hostUserId;

    if (!isHost) {
      return NextResponse.json(
        { success: false, error: "Only the host can reply" },
        { status: 403 },
      );
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        hostReply: parsed.data.hostReply,
        hostRepliedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Reply to review error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save reply" },
      { status: 500 },
    );
  }
}
