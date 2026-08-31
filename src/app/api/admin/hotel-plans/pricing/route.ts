import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { HOTEL_PLAN_TIER_IDS, type HotelPlanTierId } from "@/lib/hotel-plans";
import {
  getEffectiveHotelPlans,
  updateHotelPlanPrices,
} from "@/lib/hotel-plan-pricing";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const plans = await getEffectiveHotelPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Load hotel plan pricing error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load hotel plan pricing" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      prices?: Array<{ tier?: string; price?: number; currency?: string }>;
    };

    if (!body.prices?.length) {
      return NextResponse.json(
        { success: false, error: "No prices provided" },
        { status: 400 },
      );
    }

    const updates = body.prices
      .filter(
        (row): row is { tier: HotelPlanTierId; price: number; currency?: string } =>
          Boolean(
            row.tier &&
              HOTEL_PLAN_TIER_IDS.includes(row.tier as HotelPlanTierId) &&
              typeof row.price === "number",
          ),
      )
      .map((row) => ({
        tier: row.tier as HotelPlanTierId,
        price: row.price,
        currency: row.currency,
      }));

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid price updates" },
        { status: 400 },
      );
    }

    const plans = await updateHotelPlanPrices(updates);
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Update hotel plan pricing error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to update hotel plan pricing",
      },
      { status: 400 },
    );
  }
}
