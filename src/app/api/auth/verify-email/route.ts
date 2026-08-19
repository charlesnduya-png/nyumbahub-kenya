import { NextResponse } from "next/server";
import { z } from "zod";

import { verifyEmailOtp } from "@/lib/email-otp";

const schema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Enter a valid email and 6-digit code" },
        { status: 400 },
      );
    }

    const result = await verifyEmailOtp(parsed.data);
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email verified. You can sign in now.",
      data: result.user,
    });
  } catch (error) {
    console.error("verify email failed:", error);
    return NextResponse.json(
      { success: false, error: "Could not verify code" },
      { status: 500 },
    );
  }
}
