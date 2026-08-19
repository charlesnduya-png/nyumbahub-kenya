import { NextResponse } from "next/server";
import { z } from "zod";

import { createAndSendEmailOtp } from "@/lib/email-otp";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Valid email is required" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found for that email" },
        { status: 404 },
      );
    }

    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        message: "Email is already verified. You can sign in.",
      });
    }

    const result = await createAndSendEmailOtp({
      email,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      previewCode: "previewCode" in result ? result.previewCode : undefined,
      message: result.sent
        ? "Verification code sent to your email"
        : "Mail is not configured yet. Ask admin to set Gmail App Password.",
    });
  } catch (error) {
    console.error("resend verification code failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not send verification code" },
      { status: 500 },
    );
  }
}
