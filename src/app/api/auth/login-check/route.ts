import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import {
  dashboardHomeForRole,
  isSiteOwnerEmail,
  SITE_OWNER_EMAIL,
} from "@/lib/site-owner";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

function ownerPassword() {
  const fromEnv = process.env.SITE_OWNER_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : "Babyblaq555@";
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password. Please try again." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const password = parsed.data.password;

    if (isSiteOwnerEmail(email)) {
      const expected = ownerPassword();
      const user = await prisma.user.findUnique({
        where: { email: SITE_OWNER_EMAIL },
        select: { passwordHash: true, role: true, isActive: true },
      });

      const passwordOk =
        password === expected ||
        password.trim() === expected ||
        (user?.passwordHash
          ? await bcrypt.compare(password, user.passwordHash)
          : false);

      if (!passwordOk) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid email or password. Please try again.",
          },
          { status: 401 },
        );
      }

      return NextResponse.json({
        success: true,
        isOwner: true,
        role: "ADMIN",
        redirectTo: "/dashboard/admin",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        role: true,
        passwordHash: true,
        isActive: true,
        emailVerified: true,
      },
    });

    if (!user?.passwordHash || !user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password. Please try again.",
        },
        { status: 401 },
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password. Please try again.",
        },
        { status: 401 },
      );
    }

    if (!user.emailVerified) {
      const pendingCode = await prisma.verificationToken.findFirst({
        where: {
          identifier: `email-verify:${email}`,
          expires: { gt: new Date() },
        },
        select: { identifier: true },
      });
      if (pendingCode) {
        return NextResponse.json(
          {
            success: false,
            needsVerification: true,
            error:
              "Verify your email first. Enter the 6-digit code we sent you.",
          },
          { status: 403 },
        );
      }
    }

    return NextResponse.json({
      success: true,
      isOwner: false,
      role: user.role,
      redirectTo: dashboardHomeForRole(user.role, email),
    });
  } catch (error) {
    console.error("login-check failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to sign in right now. Please try again." },
      { status: 500 },
    );
  }
}
