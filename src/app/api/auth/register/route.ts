import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createDemoUser } from "@/lib/users-store";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { name, email, phone, password, role } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    try {
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalizedEmail }, { phone }],
        },
      });

      if (existing) {
        return NextResponse.json(
          { success: false, error: "An account with this email or phone already exists" },
          { status: 409 },
        );
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email: normalizedEmail,
          phone,
          passwordHash,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      });

      if (role === "AGENT") {
        await prisma.agent.create({
          data: {
            userId: user.id,
            agencyName: `${name}'s Agency`,
            county: "Nairobi",
            town: "Nairobi CBD",
            verificationStatus: "PENDING",
          },
        });
      }

      return NextResponse.json({ success: true, data: user }, { status: 201 });
    } catch {
      // On production (Vercel), we must not create "fake" demo users when Postgres is missing.
      // The correct fix is to configure DATABASE_URL + run migrations.
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          {
            success: false,
            error:
              "Database is unavailable. Connect Postgres (DATABASE_URL) to create real accounts.",
          },
          { status: 503 },
        );
      }

      const demo = createDemoUser({
        name,
        email: normalizedEmail,
        phone,
        password,
        role,
      });

      if ("error" in demo) {
        return NextResponse.json(
          { success: false, error: "An account with this email or phone already exists" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          source: "demo",
          data: {
            id: demo.id,
            name: demo.name,
            email: demo.email,
            phone: demo.phone,
            role: demo.role,
            createdAt: demo.createdAt,
          },
        },
        { status: 201 },
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to create account. Please try again." },
      { status: 500 },
    );
  }
}
