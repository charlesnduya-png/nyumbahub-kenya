import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { listDemoUsers } from "@/lib/users-store";
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

    try {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          image: true,
          agentProfile: { select: { id: true, isFeatured: true, isVerified: true } },
        },
      });

      if (users.length > 0) {
        return NextResponse.json({
          success: true,
          source: "database",
          data: users.map((u) => ({
            id: u.id,
            name: u.name ?? "—",
            email: u.email,
            phone: u.phone ?? "—",
            role: u.role,
            isActive: u.isActive,
            createdAt: u.createdAt.toISOString(),
            image: u.image,
            hasAgentProfile: Boolean(u.agentProfile),
          })),
        });
      }
    } catch {
      // demo fallback
    }

    return NextResponse.json({
      success: true,
      source: "demo",
      data: listDemoUsers().map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        image: u.image ?? null,
        hasAgentProfile: u.role === "AGENT",
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load users" },
      { status: 500 },
    );
  }
}
