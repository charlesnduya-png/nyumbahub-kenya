import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
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
    const { id: propertyId } = await params;
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const property = await prisma.property.findFirst({
      where: { OR: [{ id: propertyId }, { slug: propertyId }] },
      select: { id: true, agentId: true, ownerId: true, title: true },
    });

    if (!property) {
      return NextResponse.json(
        { success: false, error: "Property not found" },
        { status: 404 },
      );
    }

    const session = await auth();
    const data = parsed.data;

    const lead = await prisma.lead.create({
      data: {
        propertyId: property.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: data.message,
        source: data.source ?? "website",
        buyerId: session?.user?.id,
        agentId: property.agentId ?? property.ownerId,
      },
    });

    return NextResponse.json({ success: true, data: lead }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to submit enquiry" },
      { status: 500 },
    );
  }
}
