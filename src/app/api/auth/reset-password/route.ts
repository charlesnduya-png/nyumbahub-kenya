import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

import { consumePasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Check your password and try again",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { email, token, password } = parsed.data;
    const consumed = await consumePasswordResetToken({ email, token });
    if (!consumed.ok) {
      return NextResponse.json(
        { success: false, error: consumed.error },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: consumed.email },
      select: { id: true, isActive: true },
    });

    if (!user?.isActive) {
      return NextResponse.json(
        { success: false, error: "Account not found" },
        { status: 404 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        // Recovering access also confirms they own the inbox
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password updated. You can sign in now.",
    });
  } catch (error) {
    console.error("reset-password failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not reset password. Try again." },
      { status: 500 },
    );
  }
}
