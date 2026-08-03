import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  findStoredUserById,
  setDemoUserActive,
  setDemoUserRole,
} from "@/lib/users-store";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["BUYER", "SELLER", "AGENT", "ADMIN"]).optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (id === session.user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own admin account here" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success || Object.keys(parsed.data).length === 0) {
      return NextResponse.json(
        { success: false, error: "Provide isActive and/or role" },
        { status: 400 },
      );
    }

    const { isActive, role } = parsed.data;

    try {
      const existing = await prisma.user.findUnique({ where: { id } });
      if (!existing) throw new Error("NOT_FOUND_DB");

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(typeof isActive === "boolean" ? { isActive } : {}),
          ...(role ? { role } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          image: true,
        },
      });

      return NextResponse.json({
        success: true,
        source: "database",
        data: {
          ...user,
          name: user.name ?? "—",
          phone: user.phone ?? "—",
          createdAt: user.createdAt.toISOString(),
          hasAgentProfile: user.role === "AGENT",
        },
      });
    } catch {
      if (typeof isActive === "boolean") setDemoUserActive(id, isActive);
      if (role) setDemoUserRole(id, role);

      const demo = findStoredUserById(id);
      if (!demo) {
        return NextResponse.json(
          { success: false, error: "User not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        source: "demo",
        data: {
          id: demo.id,
          name: demo.name,
          email: demo.email,
          phone: demo.phone,
          role: demo.role,
          isActive: demo.isActive,
          createdAt: demo.createdAt,
          image: demo.image ?? null,
          hasAgentProfile: demo.role === "AGENT",
        },
      });
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to update user" },
      { status: 500 },
    );
  }
}
