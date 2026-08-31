import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { getHotelPlanUsage, setHotelPlanTier } from "@/lib/hotel-plan-server";
import { getEffectiveHotelPlans } from "@/lib/hotel-plan-pricing";
import { HOTEL_PLAN_TIER_IDS, type HotelPlanTierId } from "@/lib/hotel-plans";
import { hotelTierToProductId } from "@/lib/pricing";
import type { HotelPlanTier } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const [usage, plans] = await Promise.all([
    getHotelPlanUsage(ctx.actingOwnerId),
    getEffectiveHotelPlans(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      usage,
      plans,
    },
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 });
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (ctx.isTeamMember) {
    return NextResponse.json(
      { success: false, error: "Only the account owner can change hotel plans" },
      { status: 403 },
    );
  }

  try {
    const body = (await req.json()) as { tier?: HotelPlanTierId };
    if (!body.tier || !HOTEL_PLAN_TIER_IDS.includes(body.tier)) {
      return NextResponse.json({ success: false, error: "Invalid plan" }, { status: 400 });
    }

    const plans = await getEffectiveHotelPlans();
    const plan = plans.find((p) => p.id === body.tier)!;
    const checkoutProductId = hotelTierToProductId(body.tier);

    if (checkoutProductId) {
      return NextResponse.json(
        {
          success: false,
          error: "Complete M-Pesa payment to activate this hotel plan.",
          code: "PAYMENT_REQUIRED",
          productId: checkoutProductId,
          tier: body.tier,
          amount: plan.price,
        },
        { status: 402 },
      );
    }

    await setHotelPlanTier(
      ctx.actingOwnerId,
      body.tier as HotelPlanTier,
      plan.durationDays,
    );

    const usage = await getHotelPlanUsage(ctx.actingOwnerId);
    return NextResponse.json({ success: true, data: usage });
  } catch (error) {
    console.error("Set hotel plan error:", error);
    return NextResponse.json({ success: false, error: "Could not update plan" }, { status: 500 });
  }
}
