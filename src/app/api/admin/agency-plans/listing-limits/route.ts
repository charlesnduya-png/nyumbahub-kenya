import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import {
  getEffectiveAgencyPlans,
  updateAgencyPlanListingLimits,
} from "@/lib/agency-plan-limits";
import { AGENCY_PLANS, type AgencyPlanTierId } from "@/lib/agency-plans";

import type { Session } from "next-auth";

function isAdminSession(session: Session | null) {
  return (
    Boolean(session?.user?.id) &&
    (session?.user?.role === "ADMIN" || isSiteOwnerEmail(session?.user?.email))
  );
}

export async function GET() {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const plans = await getEffectiveAgencyPlans();
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Load agency listing limits error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load agency listing limits" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!isAdminSession(session)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json()) as {
      limits?: Array<{ tier?: string; maxListings?: number | null }>;
    };

    if (!body.limits?.length) {
      return NextResponse.json(
        { success: false, error: "No limits provided" },
        { status: 400 },
      );
    }

    const validTiers = new Set(AGENCY_PLANS.map((p) => p.id));
    const updates = body.limits
      .filter(
        (row): row is { tier: AgencyPlanTierId; maxListings: number | null } =>
          Boolean(row.tier && validTiers.has(row.tier as AgencyPlanTierId)) &&
          (typeof row.maxListings === "number" || row.maxListings === null),
      )
      .map((row) => ({
        tier: row.tier,
        maxListings: row.maxListings,
      }));

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid limit updates" },
        { status: 400 },
      );
    }

    const plans = await updateAgencyPlanListingLimits(updates);
    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    console.error("Update agency listing limits error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unable to update listing limits",
      },
      { status: 400 },
    );
  }
}
