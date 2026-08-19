import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSiteOwnerEmail } from "@/lib/site-owner";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function requireAdmin() {
  const session = await auth();
  const isAdmin =
    session?.user?.role === "ADMIN" ||
    isSiteOwnerEmail(session?.user?.email);
  if (!session?.user?.id || !isAdmin) {
    return { error: NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 }) };
  }
  return { session };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const gate = await requireAdmin();
    if ("error" in gate && gate.error) return gate.error;

    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        agentProfile: { select: { id: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const agentId = user.agentProfile?.id;
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { ownerId: id },
          ...(agentId ? [{ agentId }] : []),
        ],
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        price: true,
        currency: true,
        listingType: true,
        propertyType: true,
        status: true,
        county: true,
        town: true,
        views: true,
        ownerId: true,
        agentId: true,
        createdAt: true,
        images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name ?? "—",
          email: user.email,
          role: user.role,
        },
        listings: properties.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          currency: p.currency,
          listingType: p.listingType,
          propertyType: p.propertyType,
          status: p.status,
          county: p.county,
          town: p.town,
          views: p.views,
          createdAt: p.createdAt.toISOString(),
          imageUrl: p.images[0]?.url ?? null,
          asOwner: p.ownerId === id,
          asAgent: Boolean(agentId && p.agentId === agentId),
        })),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load listings" },
      { status: 500 },
    );
  }
}
