import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateViewingStatusSchema } from "@/lib/validations/viewing";
import { resolveProfessionalActingContext } from "@/lib/account-team";

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

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const hostUserId = ctx.actingOwnerId;
  const isAdmin = session.user.role === "ADMIN";

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateViewingStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid status update" },
        { status: 400 },
      );
    }

    const viewing = await prisma.viewing.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            ownerId: true,
            agent: { select: { userId: true } },
          },
        },
        buyer: { select: { id: true, name: true } },
      },
    });

    if (!viewing) {
      return NextResponse.json(
        { success: false, error: "Viewing not found" },
        { status: 404 },
      );
    }

    const isHost =
      viewing.property.ownerId === hostUserId ||
      viewing.property.agent?.userId === hostUserId;
    const isBuyer = viewing.buyerId === session.user.id;

    if (parsed.data.status === "CANCELLED") {
      if (!isHost && !isBuyer) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
      if (isHost && !isAdmin && !ctx.permissions.manageViewings) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    } else {
      if (!isHost && !isAdmin) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
      if (isHost && !isAdmin && !ctx.permissions.manageViewings) {
        return NextResponse.json(
          { success: false, error: "Forbidden" },
          { status: 403 },
        );
      }
    }

    const updated = await prisma.viewing.update({
      where: { id },
      data: {
        status: parsed.data.status,
        notes: parsed.data.notes ?? viewing.notes,
      },
    });

    if (parsed.data.status === "CONFIRMED" || parsed.data.status === "CANCELLED") {
      const whenLabel = viewing.scheduledAt.toLocaleString("en-KE", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

      await prisma.notification.create({
        data: {
          userId: viewing.buyerId,
          type: "LEAD",
          title:
            parsed.data.status === "CONFIRMED"
              ? "Viewing confirmed"
              : "Viewing cancelled",
          body:
            parsed.data.status === "CONFIRMED"
              ? `Your viewing for ${viewing.property.title} on ${whenLabel} was confirmed.`
              : `Your viewing for ${viewing.property.title} on ${whenLabel} was cancelled.`,
          link: "/dashboard/tenant/viewings",
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update viewing error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update viewing" },
      { status: 500 },
    );
  }
}
