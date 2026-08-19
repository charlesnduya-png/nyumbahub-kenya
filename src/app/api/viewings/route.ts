import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPropertyHostUserId } from "@/lib/messages";
import { prisma } from "@/lib/prisma";
import { createViewingSchema } from "@/lib/validations/viewing";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";

function proViewingsLink() {
  return "/dashboard/pro/viewings";
}

function tenantViewingsLink() {
  return "/dashboard/tenant/viewings";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);

  const canHostViewings =
    session.user.role === "ADMIN" || canViewWith(ctx, "manageViewings");

  const hostUserId = ctx.actingOwnerId;
  const buyerUserId = session.user.id;

  try {
    if (canHostViewings) {
      const viewings = await prisma.viewing.findMany({
        where: {
          property: {
            OR: [{ ownerId: hostUserId }, { agent: { userId: hostUserId } }],
          },
        },
        include: {
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
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { scheduledAt: "asc" },
        take: 200,
      });

      return NextResponse.json({ success: true, data: viewings, view: "host" });
    }

    const viewings = await prisma.viewing.findMany({
      where: { buyerId: buyerUserId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            slug: true,
            town: true,
            county: true,
            estate: true,
            agent: {
              select: {
                agencyName: true,
                user: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { scheduledAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, data: viewings, view: "buyer" });
  } catch (error) {
    console.error("List viewings error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load viewings" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in to book a viewing" },
      { status: 401 },
    );
  }

  const { assertTenantContactAccess } = await import("@/lib/tenant-access");
  const access = await assertTenantContactAccess({
    userId: session.user.id,
    role: session.user.role,
  });
  if (!access.ok) {
    return NextResponse.json(
      {
        success: false,
        error: access.error,
        code: access.code,
        productId: access.productId,
        price: access.price,
        hours: access.hours,
      },
      { status: 402 },
    );
  }

  try {
    const body = await request.json();
    const parsed = createViewingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const scheduledAt = new Date(parsed.data.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date or time" },
        { status: 400 },
      );
    }

    if (scheduledAt.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { success: false, error: "Pick a future date and time" },
        { status: 400 },
      );
    }

    const hostInfo = await getPropertyHostUserId(parsed.data.propertyId);
    if (!hostInfo) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: hostInfo.propertyId },
      select: {
        id: true,
        title: true,
        slug: true,
        ownerId: true,
        agentId: true,
        listingType: true,
        status: true,
      },
    });

    if (!property || property.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "Property not available" },
        { status: 404 },
      );
    }

    if (property.listingType === "HOLIDAY") {
      return NextResponse.json(
        { success: false, error: "Use BnB booking for holiday stays" },
        { status: 400 },
      );
    }

    if (
      property.ownerId === session.user.id ||
      hostInfo.hostUserId === session.user.id
    ) {
      return NextResponse.json(
        { success: false, error: "You cannot book a viewing on your own listing" },
        { status: 400 },
      );
    }

    const buyer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });

    const notes = parsed.data.notes?.trim() || null;
    const phone = parsed.data.phone?.trim() || buyer?.phone || null;
    const whenLabel = scheduledAt.toLocaleString("en-KE", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const viewing = await prisma.viewing.create({
      data: {
        propertyId: property.id,
        buyerId: session.user.id,
        scheduledAt,
        notes,
        status: "SCHEDULED",
      },
    });

    const enquiryMessage = [
      `Viewing request for ${property.title}`,
      `Preferred time: ${whenLabel}`,
      phone ? `Phone: ${phone}` : null,
      notes ? `Note: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    await prisma.lead.create({
      data: {
        propertyId: property.id,
        buyerId: session.user.id,
        agentId: hostInfo.hostUserId,
        name: session.user.name ?? buyer?.name ?? "Buyer",
        email: session.user.email ?? buyer?.email,
        phone,
        message: enquiryMessage,
        source: "viewing_booking",
        status: "VIEWING_SCHEDULED",
      },
    });

    await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: hostInfo.hostUserId,
        content: enquiryMessage,
        propertyId: property.id,
      },
    });

    await prisma.notification.create({
      data: {
        userId: hostInfo.hostUserId,
        type: "LEAD",
        title: "New viewing request",
        body: `${session.user.name ?? "A buyer"} requested a viewing for ${property.title} on ${whenLabel}.`,
        link: proViewingsLink(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: viewing,
        message: "Viewing request sent. The agent will confirm your slot.",
        redirectTo: tenantViewingsLink(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create viewing error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to book viewing" },
      { status: 500 },
    );
  }
}
