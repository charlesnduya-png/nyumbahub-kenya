import { NextResponse } from "next/server";

import { createAndSendPasswordReset } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations/auth";

const SUCCESS_MESSAGE =
  "If an account exists for that email, you will receive password reset instructions shortly.";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Enter a valid email address",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const email = parsed.data.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, passwordHash: true, isActive: true },
    });

    // Always look successful to avoid email enumeration
    if (!user?.passwordHash || !user.isActive) {
      return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
    }

    try {
      await createAndSendPasswordReset({
        email: user.email,
        name: user.name,
      });
    } catch (error) {
      console.error("Failed to send password reset email:", error);
    }

    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  } catch (error) {
    console.error("forgot-password failed:", error);
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE });
  }
}
