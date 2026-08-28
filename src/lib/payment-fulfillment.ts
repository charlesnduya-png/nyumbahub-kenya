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

  if (productId === "tenant_access_24h" && payment.userId) {
    const { activateTenantAccess } = await import("@/lib/tenant-access");
    await activateTenantAccess({
      userId: payment.userId,
      paymentId: payment.id,
      amount: amountPaid,
    }).catch(() => null);
  }

  if (productId === "verified_badge" && payment.userId) {
    const { activateVerifiedBadge } = await import("@/lib/verification-badge");
    await activateVerifiedBadge({
      userId: payment.userId,
      paymentId: payment.id,
      amount: amountPaid,
    }).catch(() => null);
  }

  if (isListingBoostProduct(productId) && payment.userId) {
    await activateListingBoost({
      userId: payment.userId,
      productId,
      paymentId: payment.id,
      propertyId: meta.propertyId,
      amount: amountPaid,
    }).catch(() => null);
  }

  if (isMonthlyListingProduct(productId) && payment.userId) {
    const product = getProduct(productId);
    const { activateListingSubscription } = await import(
      "@/lib/listing-subscription"
    );
    await activateListingSubscription({
      userId: payment.userId,
      productId,
      amount: amountPaid ?? product?.price ?? 0,
      paymentId: payment.id,
      durationDays: product?.durationDays,
    }).catch(() => null);
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
