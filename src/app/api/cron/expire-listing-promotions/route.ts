import { NextResponse } from "next/server";

import { expireListingPromotions } from "@/lib/listing-boost";

/**
 * Clear featured/sponsored/premium flags after expiresAt.
 * Vercel cron: every 6 hours (see vercel.json). Secured with CRON_SECRET when set.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
  }

  try {
    const result = await expireListingPromotions();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("expire-listing-promotions failed:", error);
    return NextResponse.json(
      { success: false, error: "Expire promotions failed" },
      { status: 500 },
    );
  }
}
