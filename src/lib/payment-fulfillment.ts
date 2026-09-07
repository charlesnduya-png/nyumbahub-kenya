import { prisma } from "@/lib/prisma";
import { isMonthlyListingProduct } from "@/lib/listing-subscription";
import { isListingBoostProduct, activateListingBoost } from "@/lib/listing-boost";
import { getProduct } from "@/lib/pricing";

type PaymentMeta = {
  productId?: string;
  propertyId?: string | null;
  fulfilledAt?: string;
};

/**
 * Apply product-specific side effects after a payment is marked COMPLETED.
 * Idempotent — skips if metadata.fulfilledAt is already set.
 * Does not stamp fulfilledAt when a critical activation step fails, so sync can retry.
 */
export async function fulfillCompletedPayment(payment: {
  id: string;
  userId: string;
  metadata: unknown;
  amount?: number;
  mpesaReceipt?: string | null;
}) {
  const meta = (payment.metadata ?? {}) as PaymentMeta;
  if (meta.fulfilledAt || !meta.productId) {
    return;
  }

  const amountPaid = payment.amount;
  const productId = meta.productId;
  const failures: string[] = [];

  if (productId === "tenant_access_24h" && payment.userId) {
    const { activateTenantAccess } = await import("@/lib/tenant-access");
    await activateTenantAccess({
      userId: payment.userId,
      paymentId: payment.id,
      amount: amountPaid,
    }).catch((error) => {
      console.error("Tenant access activation failed:", error);
      failures.push("tenant_access");
    });
  }

  if (productId === "verified_badge" && payment.userId) {
    const { activateVerifiedBadge } = await import("@/lib/verification-badge");
    await activateVerifiedBadge({
      userId: payment.userId,
      paymentId: payment.id,
      amount: amountPaid,
    }).catch((error) => {
      console.error("Verified badge activation failed:", error);
      failures.push("verified_badge");
    });
  }

  if (isListingBoostProduct(productId) && payment.userId) {
    await activateListingBoost({
      userId: payment.userId,
      productId,
      paymentId: payment.id,
      propertyId: meta.propertyId,
      amount: amountPaid,
    }).catch((error) => {
      console.error("Listing boost activation failed:", error);
      failures.push("listing_boost");
    });
  }

  if (isMonthlyListingProduct(productId) && payment.userId) {
    const product = getProduct(productId);
    const { activateListingSubscription } = await import(
      "@/lib/listing-subscription"
    );
    try {
      await activateListingSubscription({
        userId: payment.userId,
        productId,
        amount: amountPaid ?? product?.price ?? 0,
        paymentId: payment.id,
        durationDays: product?.durationDays,
      });
    } catch (error) {
      console.error("Listing subscription activation failed:", error);
      failures.push("listing_subscription");
    }

    if (productId.startsWith("agent_") && !failures.includes("listing_subscription")) {
      const { processJobPartnerRecruitmentCommission } = await import(
        "@/lib/job-partner"
      );
      await processJobPartnerRecruitmentCommission({
        paymentId: payment.id,
        referredUserId: payment.userId,
        grossAmount: amountPaid ?? 0,
        currency: "KES",
        productId,
      }).catch((error) => {
        console.error("Agency recruitment commission failed:", error);
      });
    }
  }

  if (payment.userId) {
    const { isHotelPlanProduct } = await import("@/lib/pricing");
    if (isHotelPlanProduct(productId)) {
      try {
        const { activateHotelPlanFromPayment } = await import(
          "@/lib/hotel-plan-server"
        );
        await activateHotelPlanFromPayment({
          userId: payment.userId,
          productId,
        });
      } catch (error) {
        console.error("Hotel plan activation failed:", error);
        failures.push("hotel_plan");
      }

      if (!failures.includes("hotel_plan")) {
        const { processJobPartnerRecruitmentCommission } = await import(
          "@/lib/job-partner"
        );
        await processJobPartnerRecruitmentCommission({
          paymentId: payment.id,
          referredUserId: payment.userId,
          grossAmount: amountPaid ?? 0,
          currency: "KES",
          productId,
        }).catch((error) => {
          console.error("Hotel recruitment commission failed:", error);
        });
      }
    }
  }

  // Critical activations must succeed before we lock fulfillment.
  if (failures.length > 0) {
    console.error(
      `Payment ${payment.id} fulfillment incomplete: ${failures.join(", ")}`,
    );
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      metadata: {
        ...meta,
        fulfilledAt: new Date().toISOString(),
      },
    },
  });
}
