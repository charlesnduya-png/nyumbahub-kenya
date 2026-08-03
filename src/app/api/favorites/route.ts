import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: favorites });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to fetch favorites" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { propertyId } = await request.json();

    if (!propertyId || typeof propertyId !== "string") {
      return NextResponse.json(
        { success: false, error: "propertyId is required" },
        { status: 400 },
      );
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId,
        },
      },
      create: {
        userId: session.user.id,
        propertyId,
      },
      update: {},
    });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to add favorite" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { success: false, error: "propertyId is required" },
        { status: 400 },
      );
    }

    await prisma.favorite.deleteMany({
      where: {
        userId: session.user.id,
        propertyId,
      },
    });

    return NextResponse.json({ success: true, data: { propertyId } });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to remove favorite" },
      { status: 500 },
    );
  }
}
