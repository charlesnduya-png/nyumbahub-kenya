import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  assertCanCreateListing,
  getActiveListingSubscription,
  PRICING_MUTED,
} from "@/lib/listing-subscription";
import { canViewWith, resolveProfessionalActingContext } from "@/lib/account-team";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Sign in required" },
        { status: 401 },
      );
    }

    const ctx = await resolveProfessionalActingContext(session.user.id);
    const canViewListings = canViewWith(ctx, "manageListings");

    if (!canViewListings) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [subscription, canCreate] = await Promise.all([
      getActiveListingSubscription(ctx.actingOwnerId),
      assertCanCreateListing({
        userId: ctx.actingOwnerId,
        role: ctx.actingOwnerRole ?? session.user.role,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        active: Boolean(subscription),
        freeTier: !subscription,
        pricingMuted: PRICING_MUTED,
        listingLimit: canCreate.limit,
        used: canCreate.used ?? 0,
        remaining: canCreate.remaining ?? 0,
        atLimit: !canCreate.ok,
        subscription: subscription
          ? {
              id: subscription.id,
              plan: subscription.plan,
              status: subscription.status,
              startDate: subscription.startDate.toISOString(),
              endDate: subscription.endDate?.toISOString() ?? null,
              amount: subscription.amount,
            }
          : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to load subscription" },
      { status: 500 },
    );
  }
}
