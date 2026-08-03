import { NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, you will receive password reset instructions shortly.",
    });
  } catch {
    return NextResponse.json({
      success: true,
      message:
        "If an account exists for that email, you will receive password reset instructions shortly.",
    });
  }
}
