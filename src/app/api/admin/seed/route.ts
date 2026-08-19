import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * One-time production seed. Protected by AUTH_SECRET header.
 * POST /api/admin/seed with header: x-seed-token: <AUTH_SECRET>
 */
export async function POST(request: Request) {
  const token = request.headers.get("x-seed-token");
  const secret = process.env.AUTH_SECRET;

  if (!secret || token !== secret) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.property.count();
    if (existing > 0) {
      return NextResponse.json({
        success: true,
        message: "Database already has listings",
        count: existing,
      });
    }

    const { main } = await import("../../../../../prisma/seed");
    await main();

    const count = await prisma.property.count();

    return NextResponse.json({
      success: true,
      message: "Database seeded with sample listings",
      count,
    });
  } catch (error) {
    console.error("Seed failed:", error);
    return NextResponse.json(
      { success: false, error: "Seed failed" },
      { status: 500 },
    );
  }
}
