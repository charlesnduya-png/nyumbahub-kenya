import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { creditHotelRecruitmentCommission } from "@/lib/wallet";

export const HOTEL_RECRUITMENT_COMMISSION_RATE = 0.3;

function randomReferralCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "JH";
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export async function generateUniqueReferralCode(db: PrismaClient = prisma) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const referralCode = randomReferralCode();
    const existing = await db.jobPartnerProfile.findUnique({
      where: { referralCode },
      select: { id: true },
    });
    if (!existing) return referralCode;
  }
  return `JH${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

export async function createJobPartnerProfile(userId: string) {
  const referralCode = await generateUniqueReferralCode();
  return prisma.jobPartnerProfile.create({
    data: {
      userId,
      referralCode,
    },
  });
}

export async function findJobPartnerByReferralCode(code: string) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  return prisma.jobPartnerProfile.findUnique({
    where: { referralCode: normalized },
    include: {
      user: { select: { id: true, name: true, isActive: true, role: true } },
    },
  });
}

export function jobPartnerReferralPath(referralCode: string) {
  return `/register/professional?jobRef=${encodeURIComponent(referralCode)}`;
}

export function absoluteJobPartnerReferralUrl(
  referralCode: string,
  baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://yourhome.co.ke",
) {
  return `${baseUrl.replace(/\/$/, "")}${jobPartnerReferralPath(referralCode)}`;
}

export async function attachHotelReferral(input: {
  hotelUserId: string;
  jobRef?: string | null;
}) {
  const code = input.jobRef?.trim();
  if (!code) return null;

  const partner = await findJobPartnerByReferralCode(code);
  if (!partner || partner.user.role !== "JOB_PARTNER" || !partner.user.isActive) {
    return null;
  }
  if (partner.userId === input.hotelUserId) return null;

  const hotelUser = await prisma.user.findUnique({
    where: { id: input.hotelUserId },
    select: { referredByJobPartnerUserId: true },
  });
  if (hotelUser?.referredByJobPartnerUserId) return partner;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: input.hotelUserId,
        referredByJobPartnerUserId: null,
      },
      data: { referredByJobPartnerUserId: partner.userId },
    });
    if (updated.count === 1) {
      await tx.jobPartnerProfile.update({
        where: { userId: partner.userId },
        data: { hotelsReferred: { increment: 1 } },
      });
    }
  });

  return partner;
}

export async function processHotelRecruitmentCommission(input: {
  paymentId: string;
  hotelUserId: string;
  grossAmount: number;
  currency?: string;
  productId?: string;
}) {
  if (!input.grossAmount || input.grossAmount <= 0) return null;

  const hotelUser = await prisma.user.findUnique({
    where: { id: input.hotelUserId },
    select: {
      referredByJobPartnerUserId: true,
      name: true,
      hotelPlan: { select: { tier: true } },
    },
  });

  const partnerUserId = hotelUser?.referredByJobPartnerUserId;
  if (!partnerUserId) return null;

  const partner = await prisma.user.findUnique({
    where: { id: partnerUserId },
    select: { role: true, isActive: true, jobPartnerProfile: true },
  });
  if (
    !partner ||
    partner.role !== "JOB_PARTNER" ||
    !partner.isActive ||
    !partner.jobPartnerProfile
  ) {
    return null;
  }

  const tier = hotelUser.hotelPlan?.tier ?? "paid plan";
  const hotelLabel = hotelUser.name?.trim() || "Hotel operator";

  return creditHotelRecruitmentCommission(prisma, {
    partnerUserId,
    hotelUserId: input.hotelUserId,
    paymentId: input.paymentId,
    grossAmount: input.grossAmount,
    currency: input.currency ?? "KES",
    description: `30% hotel plan commission · ${hotelLabel} · ${tier}`,
  });
}

export type JobPartnerDashboardData = {
  profile: {
    referralCode: string;
    hotelsReferred: number;
    referralUrl: string;
  };
  summary: {
    availableBalance: number;
    pendingBalance: number;
    lifetimeEarned: number;
    lifetimePaidOut: number;
    currency: string;
    monthEarned: number;
  };
  referredHotels: Array<{
    id: string;
    name: string | null;
    email: string;
    tier: string | null;
    joinedAt: string;
    planPayments: number;
    commissionEarned: number;
  }>;
  recentCommissions: Array<{
    id: string;
    amount: number;
    grossAmount: number;
    currency: string;
    description: string;
    createdAt: string;
  }>;
};

export async function getJobPartnerDashboard(
  userId: string,
): Promise<JobPartnerDashboardData | null> {
  const profile = await prisma.jobPartnerProfile.findUnique({
    where: { userId },
  });
  if (!profile) return null;

  const [wallet, referredHotels, commissions, monthCommissions] =
    await Promise.all([
      prisma.professionalWallet.findUnique({ where: { userId } }),
      prisma.user.findMany({
        where: { referredByJobPartnerUserId: userId },
        orderBy: { createdAt: "desc" },
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          hotelPlan: { select: { tier: true } },
        },
      }),
      prisma.walletTransaction.findMany({
        where: { userId, type: "HOTEL_RECRUITMENT" },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.walletTransaction.findMany({
        where: {
          userId,
          type: "HOTEL_RECRUITMENT",
          status: { in: ["AVAILABLE", "PAID_OUT"] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { amount: true },
      }),
    ]);

  const hotelIds = referredHotels.map((row) => row.id);
  const payments =
    hotelIds.length > 0
      ? await prisma.payment.findMany({
          where: {
            userId: { in: hotelIds },
            status: "COMPLETED",
          },
          select: { userId: true, amount: true, metadata: true },
        })
      : [];

  const paymentStats = new Map<string, { count: number; gross: number }>();
  for (const payment of payments) {
    const meta = payment.metadata as { productId?: string } | null;
    if (!meta?.productId?.startsWith("hotel_plan_")) continue;
    const row = paymentStats.get(payment.userId) ?? { count: 0, gross: 0 };
    row.count += 1;
    row.gross += payment.amount;
    paymentStats.set(payment.userId, row);
  }

  const paymentIdToUser = new Map(
    (
      await prisma.payment.findMany({
        where: { id: { in: commissions.map((c) => c.sourceId) } },
        select: { id: true, userId: true },
      })
    ).map((p) => [p.id, p.userId]),
  );

  const commissionTotals = new Map<string, number>();
  for (const tx of commissions) {
    if (tx.status === "CANCELLED") continue;
    const hotelUserId = paymentIdToUser.get(tx.sourceId);
    if (!hotelUserId) continue;
    commissionTotals.set(
      hotelUserId,
      (commissionTotals.get(hotelUserId) ?? 0) + tx.amount,
    );
  }

  const monthEarned = monthCommissions.reduce((sum, row) => sum + row.amount, 0);

  return {
    profile: {
      referralCode: profile.referralCode,
      hotelsReferred: profile.hotelsReferred,
      referralUrl: absoluteJobPartnerReferralUrl(profile.referralCode),
    },
    summary: {
      availableBalance: wallet?.availableBalance ?? 0,
      pendingBalance: wallet?.pendingBalance ?? 0,
      lifetimeEarned: wallet?.lifetimeEarned ?? 0,
      lifetimePaidOut: wallet?.lifetimePaidOut ?? 0,
      currency: wallet?.currency ?? "KES",
      monthEarned,
    },
    referredHotels: referredHotels.map((hotel) => ({
      id: hotel.id,
      name: hotel.name,
      email: hotel.email,
      tier: hotel.hotelPlan?.tier ?? null,
      joinedAt: hotel.createdAt.toISOString(),
      planPayments: paymentStats.get(hotel.id)?.count ?? 0,
      commissionEarned: commissionTotals.get(hotel.id) ?? 0,
    })),
    recentCommissions: commissions.map((tx) => ({
      id: tx.id,
      amount: tx.amount,
      grossAmount: tx.grossAmount,
      currency: tx.currency,
      description: tx.description,
      createdAt: tx.createdAt.toISOString(),
    })),
  };
}

export type AdminJobPartnerRow = {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  referralCode: string;
  hotelsReferred: number;
  joinedAt: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimePaidOut: number;
  currency: string;
  pendingWithdrawals: number;
  commissionTotal: number;
  payoutLabel: string;
};

export type AdminReferredHotelRow = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  tier: string | null;
  joinedAt: string;
  partnerUserId: string;
  partnerName: string | null;
  partnerEmail: string;
  partnerReferralCode: string;
  planPayments: number;
  commissionEarned: number;
};

export type AdminJobPartnerSummary = {
  totalPartners: number;
  activePartners: number;
  suspendedPartners: number;
  totalHotelsReferred: number;
  pendingWithdrawalCount: number;
  pendingWithdrawalAmount: number;
  totalCommissionsEarned: number;
  currency: string;
};

function payoutLabelFromWallet(
  wallet: {
    payoutMethod: string | null;
    payoutAccountName: string | null;
    payoutPhone: string | null;
    payoutProvider: string | null;
    payoutBankName: string | null;
    payoutBankAccount: string | null;
    payoutCountry: string | null;
  } | null,
) {
  if (!wallet?.payoutMethod) return "Not set";
  if (wallet.payoutMethod === "MOBILE_MONEY") {
    return `${wallet.payoutProvider ?? "Mobile"} · ${wallet.payoutPhone ?? "—"}`;
  }
  if (wallet.payoutMethod === "BANK") {
    return `${wallet.payoutBankName ?? "Bank"} · ${wallet.payoutBankAccount ?? "—"}`;
  }
  return wallet.payoutAccountName ?? wallet.payoutMethod;
}

export async function getAdminJobPartnerSummary(): Promise<AdminJobPartnerSummary> {
  const [partners, pendingWithdrawals, commissionSum] = await Promise.all([
    prisma.user.findMany({
      where: { role: "JOB_PARTNER" },
      select: {
        isActive: true,
        jobPartnerProfile: { select: { hotelsReferred: true } },
      },
    }),
    prisma.walletTransaction.findMany({
      where: {
        type: "PAYOUT",
        status: "PENDING",
        user: { role: "JOB_PARTNER" },
      },
      select: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        type: "HOTEL_RECRUITMENT",
        status: { in: ["AVAILABLE", "PAID_OUT"] },
        user: { role: "JOB_PARTNER" },
      },
      _sum: { amount: true },
    }),
  ]);

  const totalHotelsReferred = partners.reduce(
    (sum, row) => sum + (row.jobPartnerProfile?.hotelsReferred ?? 0),
    0,
  );

  return {
    totalPartners: partners.length,
    activePartners: partners.filter((p) => p.isActive).length,
    suspendedPartners: partners.filter((p) => !p.isActive).length,
    totalHotelsReferred,
    pendingWithdrawalCount: pendingWithdrawals.length,
    pendingWithdrawalAmount: pendingWithdrawals.reduce(
      (sum, row) => sum + row.amount,
      0,
    ),
    totalCommissionsEarned: commissionSum._sum.amount ?? 0,
    currency: "KES",
  };
}

export async function getAdminJobPartnersList(): Promise<AdminJobPartnerRow[]> {
  const partners = await prisma.user.findMany({
    where: { role: "JOB_PARTNER" },
    orderBy: { createdAt: "desc" },
    include: {
      jobPartnerProfile: true,
      wallet: true,
    },
  });

  const partnerIds = partners.map((p) => p.id);
  const [commissionTotals, pendingByUser] = await Promise.all([
    partnerIds.length
      ? prisma.walletTransaction.groupBy({
          by: ["userId"],
          where: {
            userId: { in: partnerIds },
            type: "HOTEL_RECRUITMENT",
            status: { not: "CANCELLED" },
          },
          _sum: { amount: true },
        })
      : [],
    partnerIds.length
      ? prisma.walletTransaction.groupBy({
          by: ["userId"],
          where: {
            userId: { in: partnerIds },
            type: "PAYOUT",
            status: "PENDING",
          },
          _count: { _all: true },
        })
      : [],
  ]);

  const commissionMap = new Map(
    commissionTotals.map((row) => [row.userId, row._sum.amount ?? 0]),
  );
  const pendingMap = new Map(
    pendingByUser.map((row) => [row.userId, row._count._all]),
  );

  return partners.map((partner) => ({
    userId: partner.id,
    name: partner.name,
    email: partner.email,
    phone: partner.phone,
    isActive: partner.isActive,
    referralCode: partner.jobPartnerProfile?.referralCode ?? "—",
    hotelsReferred: partner.jobPartnerProfile?.hotelsReferred ?? 0,
    joinedAt: partner.createdAt.toISOString(),
    availableBalance: partner.wallet?.availableBalance ?? 0,
    pendingBalance: partner.wallet?.pendingBalance ?? 0,
    lifetimeEarned: partner.wallet?.lifetimeEarned ?? 0,
    lifetimePaidOut: partner.wallet?.lifetimePaidOut ?? 0,
    currency: partner.wallet?.currency ?? "KES",
    pendingWithdrawals: pendingMap.get(partner.id) ?? 0,
    commissionTotal: commissionMap.get(partner.id) ?? 0,
    payoutLabel: payoutLabelFromWallet(partner.wallet),
  }));
}

export async function getAdminReferredHotelsList(): Promise<
  AdminReferredHotelRow[]
> {
  const referred = await prisma.user.findMany({
    where: { referredByJobPartnerUserId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      referredByJobPartnerUserId: true,
      hotelPlan: { select: { tier: true } },
      referredByJobPartner: {
        select: {
          id: true,
          name: true,
          email: true,
          jobPartnerProfile: { select: { referralCode: true } },
        },
      },
    },
  });

  const hotelIds = referred.map((h) => h.id);
  const [payments, commissions] = await Promise.all([
    hotelIds.length
      ? prisma.payment.findMany({
          where: { userId: { in: hotelIds }, status: "COMPLETED" },
          select: { userId: true, amount: true, metadata: true },
        })
      : [],
    hotelIds.length
      ? prisma.walletTransaction.findMany({
          where: { type: "HOTEL_RECRUITMENT", status: { not: "CANCELLED" } },
          select: { amount: true, sourceId: true },
        })
      : [],
  ]);

  const paymentStats = new Map<string, number>();
  for (const payment of payments) {
    const meta = payment.metadata as { productId?: string } | null;
    if (!meta?.productId?.startsWith("hotel_plan_")) continue;
    paymentStats.set(payment.userId, (paymentStats.get(payment.userId) ?? 0) + 1);
  }

  const paymentIdToUser = new Map(
    (
      await prisma.payment.findMany({
        where: { id: { in: commissions.map((c) => c.sourceId) } },
        select: { id: true, userId: true },
      })
    ).map((p) => [p.id, p.userId]),
  );

  const commissionByHotel = new Map<string, number>();
  for (const tx of commissions) {
    const hotelUserId = paymentIdToUser.get(tx.sourceId);
    if (!hotelUserId) continue;
    commissionByHotel.set(
      hotelUserId,
      (commissionByHotel.get(hotelUserId) ?? 0) + tx.amount,
    );
  }

  return referred.map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    email: hotel.email,
    isActive: hotel.isActive,
    tier: hotel.hotelPlan?.tier ?? null,
    joinedAt: hotel.createdAt.toISOString(),
    partnerUserId: hotel.referredByJobPartner?.id ?? "",
    partnerName: hotel.referredByJobPartner?.name ?? null,
    partnerEmail: hotel.referredByJobPartner?.email ?? "—",
    partnerReferralCode:
      hotel.referredByJobPartner?.jobPartnerProfile?.referralCode ?? "—",
    planPayments: paymentStats.get(hotel.id) ?? 0,
    commissionEarned: commissionByHotel.get(hotel.id) ?? 0,
  }));
}

export async function getAdminJobPartnerDetail(userId: string) {
  const dashboard = await getJobPartnerDashboard(userId);
  if (!dashboard) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId, role: "JOB_PARTNER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      createdAt: true,
      nationalId: true,
      nationalIdVerified: true,
      verificationStatus: true,
      wallet: true,
      jobPartnerProfile: true,
    },
  });
  if (!user) return null;

  const withdrawals = await prisma.walletTransaction.findMany({
    where: { userId, type: "PAYOUT" },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      joinedAt: user.createdAt.toISOString(),
      nationalId: user.nationalId,
      nationalIdVerified: user.nationalIdVerified,
      verificationStatus: user.verificationStatus,
      payoutLabel: payoutLabelFromWallet(user.wallet),
    },
    profile: dashboard.profile,
    summary: dashboard.summary,
    referredHotels: dashboard.referredHotels,
    recentCommissions: dashboard.recentCommissions,
    withdrawals: withdrawals.map((row) => ({
      id: row.id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      description: row.description,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
