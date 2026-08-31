import type { Prisma, PrismaClient, WalletTxStatus, WalletTxType } from "@prisma/client";
import { syncPlatformCommission } from "@/lib/bnb-commission";
import { splitBnbPayment } from "@/lib/bnb-split";

type Db = PrismaClient | Prisma.TransactionClient;

export type WalletSummary = {
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimePaidOut: number;
  currency: string;
};

export type WalletPayoutDetails = {
  method: "MOBILE_MONEY" | "BANK" | "DIGITAL_WALLET" | null;
  country: string;
  accountName: string;
  phone: string;
  provider: string;
  bankName: string;
  bankAccount: string;
  bankBranch: string;
  swift: string;
  email: string;
};

export function emptyPayoutDetails(): WalletPayoutDetails {
  return {
    method: null,
    country: "Kenya",
    accountName: "",
    phone: "",
    provider: "M-Pesa",
    bankName: "",
    bankAccount: "",
    bankBranch: "",
    swift: "",
    email: "",
  };
}

export function payoutDetailsFromWallet(wallet: {
  payoutMethod: "MOBILE_MONEY" | "BANK" | "DIGITAL_WALLET" | null;
  payoutCountry?: string | null;
  payoutAccountName: string | null;
  payoutPhone: string | null;
  payoutProvider: string | null;
  payoutBankName: string | null;
  payoutBankAccount: string | null;
  payoutBankBranch: string | null;
  payoutSwift?: string | null;
  payoutEmail?: string | null;
}): WalletPayoutDetails {
  return {
    method: wallet.payoutMethod,
    country: wallet.payoutCountry ?? "Kenya",
    accountName: wallet.payoutAccountName ?? "",
    phone: wallet.payoutPhone ?? "",
    provider: wallet.payoutProvider ?? "M-Pesa",
    bankName: wallet.payoutBankName ?? "",
    bankAccount: wallet.payoutBankAccount ?? "",
    bankBranch: wallet.payoutBankBranch ?? "",
    swift: wallet.payoutSwift ?? "",
    email: wallet.payoutEmail ?? "",
  };
}

export function formatPayoutMethod(payout: WalletPayoutDetails) {
  if (!payout.method) return "Not set";
  const place = payout.country ? `${payout.country} · ` : "";
  if (payout.method === "MOBILE_MONEY") {
    const provider = payout.provider || "Mobile money";
    return payout.phone
      ? `${place}${provider} · ${payout.phone}`
      : `${place}${provider}`;
  }
  if (payout.method === "DIGITAL_WALLET") {
    const provider = payout.provider || "Digital wallet";
    const dest = payout.email || payout.phone;
    return dest ? `${place}${provider} · ${dest}` : `${place}${provider}`;
  }
  const bank = payout.bankName || "Bank";
  return payout.bankAccount
    ? `${place}${bank} · ${payout.bankAccount}`
    : `${place}${bank}`;
}

export type WalletTxRow = {
  id: string;
  type: WalletTxType;
  status: WalletTxStatus;
  amount: number;
  grossAmount: number;
  feeAmount: number;
  currency: string;
  sourceType: string;
  sourceId: string;
  description: string;
  createdAt: string;
  clearedAt: string | null;
};

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

async function getOrCreateWallet(db: Db, userId: string) {
  const existing = await db.professionalWallet.findUnique({
    where: { userId },
  });
  if (existing) return existing;
  return db.professionalWallet.create({
    data: { userId },
  });
}

async function applyBalanceDelta(
  db: Db,
  walletId: string,
  delta: {
    available?: number;
    pending?: number;
    earned?: number;
    paidOut?: number;
  },
) {
  await db.professionalWallet.update({
    where: { id: walletId },
    data: {
      availableBalance: { increment: roundMoney(delta.available ?? 0) },
      pendingBalance: { increment: roundMoney(delta.pending ?? 0) },
      lifetimeEarned: { increment: roundMoney(delta.earned ?? 0) },
      lifetimePaidOut: { increment: roundMoney(delta.paidOut ?? 0) },
    },
  });
}

function deltasForTransition(
  from: WalletTxStatus | null,
  to: WalletTxStatus,
  amount: number,
) {
  const next = {
    available: 0,
    pending: 0,
    earned: 0,
    paidOut: 0,
  };

  if (from === to) return next;

  if (from === "PENDING") next.pending -= amount;
  if (from === "AVAILABLE") {
    next.available -= amount;
    next.earned -= amount;
  }
  if (from === "PAID_OUT") {
    next.paidOut -= amount;
  }

  if (to === "PENDING") next.pending += amount;
  if (to === "AVAILABLE") {
    next.available += amount;
    next.earned += amount;
  }
  if (to === "PAID_OUT") next.paidOut += amount;

  return next;
}

async function upsertEarning(
  db: Db,
  input: {
    userId: string;
    type: WalletTxType;
    status: WalletTxStatus;
    amount: number;
    grossAmount: number;
    feeAmount: number;
    currency: string;
    sourceType: string;
    sourceId: string;
    description: string;
  },
) {
  const amount = roundMoney(Math.max(0, input.amount));
  const wallet = await getOrCreateWallet(db, input.userId);
  const existing = await db.walletTransaction.findUnique({
    where: {
      sourceType_sourceId: {
        sourceType: input.sourceType,
        sourceId: input.sourceId,
      },
    },
  });

  if (!existing) {
    if (input.status === "CANCELLED" || amount <= 0) return;
    await db.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: input.userId,
        type: input.type,
        status: input.status,
        amount,
        grossAmount: roundMoney(input.grossAmount),
        feeAmount: roundMoney(input.feeAmount),
        currency: input.currency,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        description: input.description,
        clearedAt: input.status === "AVAILABLE" ? new Date() : null,
      },
    });
    await applyBalanceDelta(
      db,
      wallet.id,
      deltasForTransition(null, input.status, amount),
    );
    return;
  }

  if (existing.status === input.status && existing.amount === amount) {
    return;
  }

  const reverse = deltasForTransition(existing.status, "CANCELLED", existing.amount);
  await applyBalanceDelta(db, wallet.id, reverse);

  if (input.status === "CANCELLED" || amount <= 0) {
    await db.walletTransaction.update({
      where: { id: existing.id },
      data: {
        status: "CANCELLED",
        amount,
        grossAmount: roundMoney(input.grossAmount),
        feeAmount: roundMoney(input.feeAmount),
        description: input.description,
        clearedAt: null,
      },
    });
    return;
  }

  await db.walletTransaction.update({
    where: { id: existing.id },
    data: {
      status: input.status,
      amount,
      grossAmount: roundMoney(input.grossAmount),
      feeAmount: roundMoney(input.feeAmount),
      currency: input.currency,
      description: input.description,
      clearedAt: input.status === "AVAILABLE" ? new Date() : null,
    },
  });
  await applyBalanceDelta(
    db,
    wallet.id,
    deltasForTransition(null, input.status, amount),
  );
}

export async function syncBookingWallet(
  db: Db,
  bookingId: string,
) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: {
        select: {
          title: true,
          ownerId: true,
          agent: { select: { userId: true } },
        },
      },
    },
  });
  if (!booking) return;

  const hostUserId = booking.property.agent?.userId ?? booking.property.ownerId;
  const split = splitBnbPayment(booking.totalAmount);
  const feeAmount = split.commissionAmount;
  const amount = split.hostAmount;
  const checkoutPassed = booking.checkOut.getTime() <= Date.now();

  let status: WalletTxStatus = "CANCELLED";
  if (booking.status === "COMPLETED" || (booking.status === "APPROVED" && checkoutPassed)) {
    status = "AVAILABLE";
  } else if (booking.status === "APPROVED") {
    status = "PENDING";
  }

  await upsertEarning(db, {
    userId: hostUserId,
    type: "BOOKING",
    status,
    amount,
    grossAmount: booking.totalAmount,
    feeAmount,
    currency: booking.currency,
    sourceType: "BOOKING",
    sourceId: booking.id,
    description: `BnB booking · ${booking.property.title}`,
  });

  try {
    await syncPlatformCommission(db, booking.id);
  } catch (error) {
    console.error("BnB commission sync failed:", error);
  }
}

export async function syncRentWallet(
  db: Db,
  paymentId: string,
) {
  const payment = await db.rentalRentPayment.findUnique({
    where: { id: paymentId },
    include: {
      property: {
        select: {
          title: true,
          ownerId: true,
          currency: true,
          agent: { select: { userId: true } },
        },
      },
    },
  });
  if (!payment) return;

  const hostUserId = payment.property.ownerId;
  const monthLabel = new Date(payment.year, payment.month - 1, 1).toLocaleString(
    "en-KE",
    { month: "short", year: "numeric" },
  );
  const paid = payment.status === "PAID";
  const amount = roundMoney(paid ? payment.amountPaid || payment.amountDue : 0);

  await upsertEarning(db, {
    userId: hostUserId,
    type: "RENT",
    status: paid ? "AVAILABLE" : "CANCELLED",
    amount,
    grossAmount: amount,
    feeAmount: 0,
    currency: payment.property.currency,
    sourceType: "RENT",
    sourceId: payment.id,
    description: `Rent · ${payment.property.title} · ${monthLabel}`,
  });
}

export async function syncSaleWallet(db: Db, offerId: string) {
  const offer = await db.propertyOffer.findUnique({
    where: { id: offerId },
    include: {
      property: {
        select: {
          title: true,
          ownerId: true,
          status: true,
          agent: { select: { userId: true } },
        },
      },
    },
  });
  if (!offer) return;

  const hostUserId = offer.property.agent?.userId ?? offer.property.ownerId;
  let status: WalletTxStatus = "CANCELLED";
  if (offer.status === "ACCEPTED") {
    status = offer.property.status === "SOLD" ? "AVAILABLE" : "PENDING";
  }

  await upsertEarning(db, {
    userId: hostUserId,
    type: "SALE",
    status,
    amount: roundMoney(offer.amount),
    grossAmount: offer.amount,
    feeAmount: 0,
    currency: offer.currency,
    sourceType: "SALE",
    sourceId: offer.id,
    description: `Accepted offer · ${offer.property.title}`,
  });
}

export async function syncSalesForProperty(db: Db, propertyId: string) {
  const offers = await db.propertyOffer.findMany({
    where: { propertyId, status: "ACCEPTED" },
    select: { id: true },
  });
  for (const offer of offers) {
    await syncSaleWallet(db, offer.id);
  }
}

export async function syncWalletFromActivity(db: PrismaClient, userId: string) {
  const [bookings, rentPayments, offers] = await Promise.all([
    db.booking.findMany({
      where: {
        OR: [
          { property: { ownerId: userId } },
          { property: { agent: { userId } } },
        ],
      },
      select: { id: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    }),
    db.rentalRentPayment.findMany({
      where: { property: { ownerId: userId } },
      select: { id: true },
      take: 200,
      orderBy: { updatedAt: "desc" },
    }),
    db.propertyOffer.findMany({
      where: {
        OR: [
          { property: { ownerId: userId } },
          { property: { agent: { userId } } },
        ],
      },
      select: { id: true },
      take: 200,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  for (const booking of bookings) {
    await syncBookingWallet(db, booking.id);
  }
  for (const payment of rentPayments) {
    await syncRentWallet(db, payment.id);
  }
  for (const offer of offers) {
    await syncSaleWallet(db, offer.id);
  }
}

export async function creditHotelRecruitmentCommission(
  db: Db,
  input: {
    partnerUserId: string;
    hotelUserId: string;
    paymentId: string;
    grossAmount: number;
    currency: string;
    description: string;
  },
) {
  const commission = roundMoney(input.grossAmount * 0.3);
  if (commission <= 0) return null;

  await upsertEarning(db, {
    userId: input.partnerUserId,
    type: "HOTEL_RECRUITMENT",
    status: "AVAILABLE",
    amount: commission,
    grossAmount: input.grossAmount,
    feeAmount: roundMoney(input.grossAmount - commission),
    currency: input.currency,
    sourceType: "HOTEL_RECRUITMENT",
    sourceId: input.paymentId,
    description: input.description,
  });

  return commission;
}

export async function recordWalletPayout(
  db: PrismaClient,
  input: { userId: string; amount: number; note?: string },
) {
  const amount = roundMoney(input.amount);
  if (amount <= 0) {
    throw new Error("Enter a payout amount greater than zero");
  }

  return db.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, input.userId);
    if (wallet.availableBalance + 0.001 < amount) {
      throw new Error("Payout is more than the available balance");
    }

    const payout = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: input.userId,
        type: "PAYOUT",
        status: "PAID_OUT",
        amount,
        grossAmount: amount,
        feeAmount: 0,
        sourceType: "PAYOUT",
        sourceId: `payout_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        description: input.note?.trim() || "Admin payout to professional",
        clearedAt: new Date(),
      },
    });

    await applyBalanceDelta(tx, wallet.id, {
      available: -amount,
      paidOut: amount,
    });

    return payout;
  });
}

export const MIN_WITHDRAWAL_AMOUNT = 10;
export const WITHDRAWAL_SOURCE = "WITHDRAWAL";

export async function requestWalletWithdrawal(
  db: PrismaClient,
  input: { userId: string; amount: number; note?: string },
) {
  const amount = roundMoney(input.amount);
  if (amount < MIN_WITHDRAWAL_AMOUNT) {
    throw new Error(`Minimum withdrawal is ${MIN_WITHDRAWAL_AMOUNT}`);
  }

  return db.$transaction(async (tx) => {
    const wallet = await getOrCreateWallet(tx, input.userId);
    if (!wallet.payoutMethod) {
      throw new Error("Save a payout method before requesting a withdrawal");
    }
    if (wallet.availableBalance + 0.001 < amount) {
      throw new Error("Withdrawal is more than your available balance");
    }

    const destination = formatPayoutMethod(payoutDetailsFromWallet(wallet));
    const note = input.note?.trim();
    const withdrawal = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: input.userId,
        type: "PAYOUT",
        status: "PENDING",
        amount,
        grossAmount: amount,
        feeAmount: 0,
        currency: wallet.currency,
        sourceType: WITHDRAWAL_SOURCE,
        sourceId: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        description: note
          ? `Withdrawal · ${destination} · ${note}`
          : `Withdrawal · ${destination}`,
      },
    });

    await applyBalanceDelta(tx, wallet.id, { available: -amount });
    return withdrawal;
  });
}

export async function reviewWalletWithdrawal(
  db: PrismaClient,
  input: {
    withdrawalId: string;
    action: "approve" | "reject";
    note?: string;
  },
) {
  return db.$transaction(async (tx) => {
    const row = await tx.walletTransaction.findUnique({
      where: { id: input.withdrawalId },
    });
    if (
      !row ||
      row.type !== "PAYOUT" ||
      row.sourceType !== WITHDRAWAL_SOURCE
    ) {
      throw new Error("Withdrawal request not found");
    }
    if (row.status !== "PENDING") {
      throw new Error("This withdrawal has already been reviewed");
    }

    const note = input.note?.trim();
    if (input.action === "reject") {
      await tx.walletTransaction.update({
        where: { id: row.id },
        data: {
          status: "CANCELLED",
          description: note
            ? `${row.description} · Rejected: ${note}`
            : `${row.description} · Rejected`,
        },
      });
      await applyBalanceDelta(tx, row.walletId, { available: row.amount });
      return { id: row.id, userId: row.userId, amount: row.amount, status: "CANCELLED" as const };
    }

    await tx.walletTransaction.update({
      where: { id: row.id },
      data: {
        status: "PAID_OUT",
        clearedAt: new Date(),
        description: note
          ? `${row.description} · Paid: ${note}`
          : `${row.description} · Paid`,
      },
    });
    await applyBalanceDelta(tx, row.walletId, { paidOut: row.amount });
    return { id: row.id, userId: row.userId, amount: row.amount, status: "PAID_OUT" as const };
  });
}

export async function getAdminWithdrawals(db: PrismaClient, take = 150) {
  const rows = await db.walletTransaction.findMany({
    where: { sourceType: WITHDRAWAL_SOURCE },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          agentProfile: { select: { agencyName: true } },
          wallet: {
            select: {
              payoutMethod: true,
              payoutCountry: true,
              payoutAccountName: true,
              payoutPhone: true,
              payoutProvider: true,
              payoutBankName: true,
              payoutBankAccount: true,
              payoutBankBranch: true,
              payoutSwift: true,
              payoutEmail: true,
            },
          },
        },
      },
    },
  });

  return rows
    .map((row) => ({
      ...toTxRow(row),
      userId: row.user.id,
      userName: row.user.name,
      userEmail: row.user.email,
      userRole: row.user.role,
      agencyName: row.user.agentProfile?.agencyName ?? null,
      payoutLabel: row.user.wallet
        ? formatPayoutMethod(payoutDetailsFromWallet(row.user.wallet))
        : "Not set",
    }))
    .sort((a, b) => {
      const rank = (status: string) =>
        status === "PENDING" ? 0 : status === "PAID_OUT" ? 1 : 2;
      return rank(a.status) - rank(b.status) || b.createdAt.localeCompare(a.createdAt);
    });
}

function toTxRow(tx: {
  id: string;
  type: WalletTxType;
  status: WalletTxStatus;
  amount: number;
  grossAmount: number;
  feeAmount: number;
  currency: string;
  sourceType: string;
  sourceId: string;
  description: string;
  createdAt: Date;
  clearedAt: Date | null;
}): WalletTxRow {
  return {
    id: tx.id,
    type: tx.type,
    status: tx.status,
    amount: tx.amount,
    grossAmount: tx.grossAmount,
    feeAmount: tx.feeAmount,
    currency: tx.currency,
    sourceType: tx.sourceType,
    sourceId: tx.sourceId,
    description: tx.description,
    createdAt: tx.createdAt.toISOString(),
    clearedAt: tx.clearedAt?.toISOString() ?? null,
  };
}

export async function getWalletSnapshot(db: PrismaClient, userId: string) {
  const wallet = await getOrCreateWallet(db, userId);
  return {
    summary: {
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance,
      lifetimeEarned: wallet.lifetimeEarned,
      lifetimePaidOut: wallet.lifetimePaidOut,
      currency: wallet.currency,
    } satisfies WalletSummary,
    payout: payoutDetailsFromWallet(wallet),
  };
}

export async function getWalletOverview(db: PrismaClient, userId: string) {
  await syncWalletFromActivity(db, userId);
  const snapshot = await getWalletSnapshot(db, userId);
  const transactions = await db.walletTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return {
    summary: snapshot.summary,
    payout: snapshot.payout,
    transactions: transactions.map(toTxRow),
  };
}

export async function updateWalletPayoutMethod(
  db: PrismaClient,
  userId: string,
  payout: WalletPayoutDetails,
) {
  const wallet = await getOrCreateWallet(db, userId);
  return db.professionalWallet.update({
    where: { id: wallet.id },
    data: {
      payoutMethod: payout.method,
      payoutCountry: payout.country.trim() || null,
      payoutAccountName: payout.accountName.trim() || null,
      payoutPhone: payout.phone.trim() || null,
      payoutProvider: payout.provider.trim() || null,
      payoutBankName: payout.bankName.trim() || null,
      payoutBankAccount: payout.bankAccount.trim() || null,
      payoutBankBranch: payout.bankBranch.trim() || null,
      payoutSwift: payout.swift.trim() || null,
      payoutEmail: payout.email.trim() || null,
    },
  });
}

export async function backfillRecentWalletActivity(db: PrismaClient) {
  const [bookings, rents, offers] = await Promise.all([
    db.booking.findMany({
      where: {
        status: { in: ["APPROVED", "COMPLETED", "CANCELLED", "REJECTED"] },
      },
      select: { id: true },
      take: 150,
      orderBy: { updatedAt: "desc" },
    }),
    db.rentalRentPayment.findMany({
      select: { id: true },
      take: 150,
      orderBy: { updatedAt: "desc" },
    }),
    db.propertyOffer.findMany({
      where: { status: "ACCEPTED" },
      select: { id: true },
      take: 100,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  for (const booking of bookings) {
    await syncBookingWallet(db, booking.id);
  }
  for (const payment of rents) {
    await syncRentWallet(db, payment.id);
  }
  for (const offer of offers) {
    await syncSaleWallet(db, offer.id);
  }
}

export async function getAdminWalletRankings(db: PrismaClient) {
  const users = await db.user.findMany({
    where: { role: { in: ["AGENT", "SELLER"] }, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      agentProfile: { select: { agencyName: true, isVerified: true } },
      wallet: {
        select: {
          availableBalance: true,
          pendingBalance: true,
          lifetimeEarned: true,
          lifetimePaidOut: true,
          currency: true,
          payoutMethod: true,
          payoutAccountName: true,
          payoutPhone: true,
          payoutProvider: true,
          payoutBankName: true,
          payoutBankAccount: true,
          payoutBankBranch: true,
          payoutCountry: true,
          payoutSwift: true,
          payoutEmail: true,
        },
      },
    },
  });

  return users
    .map((user) => ({
      userId: user.id,
      name: user.name ?? "Professional",
      email: user.email,
      role: user.role,
      agencyName: user.agentProfile?.agencyName ?? null,
      verified: Boolean(user.agentProfile?.isVerified),
      availableBalance: user.wallet?.availableBalance ?? 0,
      pendingBalance: user.wallet?.pendingBalance ?? 0,
      lifetimeEarned: user.wallet?.lifetimeEarned ?? 0,
      lifetimePaidOut: user.wallet?.lifetimePaidOut ?? 0,
      currency: user.wallet?.currency ?? "KES",
      payout: user.wallet
        ? payoutDetailsFromWallet(user.wallet)
        : emptyPayoutDetails(),
      payoutLabel: user.wallet
        ? formatPayoutMethod(payoutDetailsFromWallet(user.wallet))
        : "Not set",
    }))
    .sort((a, b) => b.lifetimeEarned - a.lifetimeEarned || b.pendingBalance - a.pendingBalance);
}

export async function getAdminWalletTransactions(db: PrismaClient, take = 100) {
  const rows = await db.walletTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    ...toTxRow(row),
    userId: row.user.id,
    userName: row.user.name,
    userEmail: row.user.email,
    userRole: row.user.role,
  }));
}
