import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const properties = await prisma.property.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
        images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 8 },
      },
    });

    return NextResponse.json({
      success: true,
      data: properties,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load pending listings" },
      { status: 500 },
    );
  }
}
