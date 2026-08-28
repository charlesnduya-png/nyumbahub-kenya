import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  VERIFIED_BADGE_DAYS,
  VERIFIED_BADGE_PRICE,
  VERIFIED_BADGE_PRODUCT_ID,
} from "@/lib/pricing";
import { activateVerifiedBadge } from "@/lib/verification-badge";

const activateSchema = z.object({
  paymentId: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const parsed = activateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const result = await activateVerifiedBadge({
      userId: session.user.id,
      paymentId: parsed.data.paymentId,
    });

    return NextResponse.json({
      success: true,
      data: {
        active: true,
        expiresAt: result.expiresAt.toISOString(),
        productId: VERIFIED_BADGE_PRODUCT_ID,
        price: VERIFIED_BADGE_PRICE,
        days: VERIFIED_BADGE_DAYS,
      },
      message: "Verified seller badge active for 90 days",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to activate verified badge" },
      { status: 500 },
    );
  }
}
