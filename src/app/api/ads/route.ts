import { NextResponse } from "next/server";

import { getActiveAds, isAdPlacement } from "@/lib/ads";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placement = searchParams.get("placement") ?? "";
  if (!isAdPlacement(placement)) {
    return NextResponse.json(
      { success: false, error: "Unknown ad placement" },
      { status: 400 },
    );
  }

  const takeRaw = Number(searchParams.get("take") ?? "3");
  const take = Number.isInteger(takeRaw) ? Math.min(6, Math.max(1, takeRaw)) : 3;
  const data = await getActiveAds(placement, take);
  return NextResponse.json({ success: true, data });
}
