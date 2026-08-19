import { prisma } from "@/lib/prisma";
import { TENANT_ACCESS_REQUIRED } from "@/lib/listing-flags";
import {
  getProduct,
  TENANT_ACCESS_HOURS,
  TENANT_ACCESS_PRICE,
  TENANT_ACCESS_PRODUCT_ID,
} from "@/lib/pricing";

const PROFESSIONAL_ROLES = new Set(["SELLER", "AGENT", "ADMIN"]);

export function roleNeedsTenantAccessPass(role?: string | null) {
  if (!TENANT_ACCESS_REQUIRED) return false;
  if (!role) return true;
  return !PROFESSIONAL_ROLES.has(role);
}

export async function getActiveTenantAccess(userId: string) {
  const now = new Date();
  return prisma.subscription.findFirst({
    where: {
      userId,
      plan: "TENANT_PASS",
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gt: now } }],
    },
    orderBy: { endDate: "desc" },
  });
}

export async function hasActiveTenantAccess(userId: string) {
  if (!TENANT_ACCESS_REQUIRED) return true;
  const pass = await getActiveTenantAccess(userId);
  return Boolean(pass);
}

/**
 * Tenants (BUYER) need an active 24h pass for chat / reserve / call
 * when TENANT_ACCESS_REQUIRED is on. Pros and admins are exempt.
 */
export async function assertTenantContactAccess(input: {
  userId: string;
  role?: string | null;
}) {
  if (!TENANT_ACCESS_REQUIRED) {
    return { ok: true as const, pass: null };
  }

  if (!roleNeedsTenantAccessPass(input.role)) {
    return { ok: true as const, pass: null };
  }

  const pass = await getActiveTenantAccess(input.userId);
  if (pass) {
    return { ok: true as const, pass };
  }

  return {
    ok: false as const,
    pass: null,
    error:
      "Pay KES 150 for a 24-hour viewing pass to chat, reserve, or call landlords.",
    code: "TENANT_ACCESS_REQUIRED" as const,
    productId: TENANT_ACCESS_PRODUCT_ID,
    price: TENANT_ACCESS_PRICE,
    hours: TENANT_ACCESS_HOURS,
  };
}

export async function activateTenantAccess(input: {
  userId: string;
  paymentId?: string;
  amount?: number;
}) {
  const product = getProduct(TENANT_ACCESS_PRODUCT_ID);
  const hours = product?.durationHours ?? TENANT_ACCESS_HOURS;
  const amount = input.amount ?? product?.price ?? TENANT_ACCESS_PRICE;
  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: input.userId,
      plan: "TENANT_PASS",
      status: "ACTIVE",
      OR: [{ endDate: null }, { endDate: { gt: startDate } }],
    },
    orderBy: { endDate: "desc" },
  });

  if (existing?.endDate && existing.endDate > startDate) {
    // Extend from current expiry if still active
    const nextEnd = new Date(
      existing.endDate.getTime() + hours * 60 * 60 * 1000,
    );
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: "ACTIVE",
        endDate: nextEnd,
        amount,
        autoRenew: false,
      },
    });

    if (input.paymentId) {
      await prisma.payment
        .update({
          where: { id: input.paymentId },
          data: { subscriptionId: updated.id, status: "COMPLETED" },
        })
        .catch(() => null);
    }

    return updated;
  }

  const created = await prisma.subscription.create({
    data: {
      userId: input.userId,
      plan: "TENANT_PASS",
      status: "ACTIVE",
      startDate,
      endDate,
      amount,
      currency: "KES",
      autoRenew: false,
    },
  });

  if (input.paymentId) {
    await prisma.payment
      .update({
        where: { id: input.paymentId },
        data: { subscriptionId: created.id, status: "COMPLETED" },
      })
      .catch(() => null);
  }

  return created;
}
