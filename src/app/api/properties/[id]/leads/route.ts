import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getPropertyHostUserId } from "@/lib/messages";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().trim().min(9).max(15).optional().nullable(),
  message: z.string().trim().max(2000).optional().nullable(),
  source: z.string().trim().max(50).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Sign in and buy a 24-hour viewing pass (KES 150) to contact landlords.",
          code: "TENANT_ACCESS_REQUIRED",
        },
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

    const { id: propertyId } = await params;
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const hostInfo = await getPropertyHostUserId(propertyId);

    if (!hostInfo) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: hostInfo.propertyId },
      select: { id: true, agentId: true, ownerId: true, title: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const data = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        propertyId: property.id,
        name: data.name || session.user.name || "Tenant",
        email: data.email || session.user.email,
        phone: data.phone,
        message: data.message,
        source: data.source ?? "website",
        buyerId: session.user.id,
        agentId: property.agentId ?? property.ownerId,
      },
    });

    if (data.message) {
      await prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId: hostInfo.hostUserId,
          content: data.message,
          propertyId: property.id,
        },
      });

      const host = await prisma.user.findUnique({
        where: { id: hostInfo.hostUserId },
        select: { role: true },
      });

      const inboxLink =
        host?.role === "BUYER"
          ? `/dashboard/tenant/messages?peer=${session.user.id}&property=${property.id}`
          : `/dashboard/pro/inbox?peer=${session.user.id}&property=${property.id}`;

      await prisma.notification.create({
        data: {
          userId: hostInfo.hostUserId,
          type: "LEAD",
          title: "New property enquiry",
          body: `${session.user.name ?? data.name} enquired about ${property.title}.`,
          link: inboxLink,
        },
      });
    }

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to submit enquiry" },
      { status: 500 },
    );
  }
}
