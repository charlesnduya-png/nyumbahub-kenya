import type { PrismaClient } from "@prisma/client";
import { agencyProductIdToTier } from "@/lib/agency-plans";
import { isHotelPlanProduct } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";
import { JOB_PARTNER_COMMISSION_RATE } from "@/lib/job-partner-copy";
import { creditHotelRecruitmentCommission, formatPayoutMethod, payoutDetailsFromWallet } from "@/lib/wallet";

export const HOTEL_RECRUITMENT_COMMISSION_RATE = JOB_PARTNER_COMMISSION_RATE;

export function isJobPartnerCommissionProduct(productId?: string | null) {
  if (!productId) return false;
  return isHotelPlanProduct(productId) || productId.startsWith("agent_");
}

export function isAgencyCommissionProduct(productId?: string | null) {
  return Boolean(productId?.startsWith("agent_"));
}

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

export async function attachProfessionalReferral(input: {
  referredUserId: string;
  jobRef?: string | null;
}) {
  const code = input.jobRef?.trim();
  if (!code) return null;

  const partner = await findJobPartnerByReferralCode(code);
  if (!partner || partner.user.role !== "JOB_PARTNER" || !partner.user.isActive) {
    return null;
  }
  if (partner.userId === input.referredUserId) return null;

  const referredUser = await prisma.user.findUnique({
    where: { id: input.referredUserId },
    select: { referredByJobPartnerUserId: true },
  });
  if (referredUser?.referredByJobPartnerUserId) return partner;

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.updateMany({
      where: {
        id: input.referredUserId,
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

/** @deprecated Use attachProfessionalReferral */
export async function attachHotelReferral(input: {
  hotelUserId: string;
  jobRef?: string | null;
}) {
  return attachProfessionalReferral({
    referredUserId: input.hotelUserId,
    jobRef: input.jobRef,
  });
}

function commissionDescription(input: {
  productId?: string;
  accountLabel: string;
  planLabel: string;
}) {
  const pct = Math.round(JOB_PARTNER_COMMISSION_RATE * 100);
  if (isAgencyCommissionProduct(input.productId)) {
    return `${pct}% agency plan commission · ${input.accountLabel} · ${input.planLabel}`;
  }
  return `${pct}% hotel plan commission · ${input.accountLabel} · ${input.planLabel}`;
}

export async function processJobPartnerRecruitmentCommission(input: {
  paymentId: string;
  referredUserId: string;
  grossAmount: number;
  currency?: string;
  productId?: string;
}) {
  if (!input.grossAmount || input.grossAmount <= 0) return null;
  if (!isJobPartnerCommissionProduct(input.productId)) return null;

  const referredUser = await prisma.user.findUnique({
    where: { id: input.referredUserId },
    select: {
      referredByJobPartnerUserId: true,
      name: true,
      role: true,
      hotelPlan: { select: { tier: true } },
      agentProfile: { select: { agencyName: true } },
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { plan: true },
      },
    },
  });

  const partnerUserId = referredUser?.referredByJobPartnerUserId;
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

  const agencyTier = input.productId?.startsWith("agent_")
    ? agencyProductIdToTier(input.productId)
    : null;
  const planLabel =
    agencyTier ??
    referredUser.hotelPlan?.tier ??
    referredUser.subscriptions[0]?.plan ??
    "paid plan";
  const accountLabel =
    referredUser.agentProfile?.agencyName?.trim() ||
    referredUser.name?.trim() ||
    (referredUser.role === "AGENT" ? "Agency" : "Professional");

  return creditHotelRecruitmentCommission(prisma, {
    partnerUserId,
    hotelUserId: input.referredUserId,
    paymentId: input.paymentId,
    grossAmount: input.grossAmount,
    currency: input.currency ?? "KES",
    description: commissionDescription({
      productId: input.productId,
      accountLabel,
      planLabel: String(planLabel).replace(/_/g, " "),
    }),
  });
}

/** @deprecated Use processJobPartnerRecruitmentCommission */
export async function processHotelRecruitmentCommission(input: {
  paymentId: string;
  hotelUserId: string;
  grossAmount: number;
  currency?: string;
  productId?: string;
}) {
  return processJobPartnerRecruitmentCommission({
    paymentId: input.paymentId,
    referredUserId: input.hotelUserId,
    grossAmount: input.grossAmount,
    currency: input.currency,
    productId: input.productId,
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
  referredProfessionals: Array<{
    id: string;
    name: string | null;
    email: string;
    role: string;
    accountType: string;
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

  const [wallet, referredUsers, commissions, monthCommissions] =
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
          role: true,
          createdAt: true,
          hotelPlan: { select: { tier: true } },
          agentProfile: { select: { agencyName: true } },
          subscriptions: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { plan: true },
          },
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

  const referredIds = referredUsers.map((row) => row.id);
  const payments =
    referredIds.length > 0
      ? await prisma.payment.findMany({
          where: {
            userId: { in: referredIds },
            status: "COMPLETED",
          },
          select: { userId: true, amount: true, metadata: true },
        })
      : [];

  const paymentStats = new Map<string, { count: number; gross: number }>();
  for (const payment of payments) {
    const meta = payment.metadata as { productId?: string } | null;
    if (!isJobPartnerCommissionProduct(meta?.productId)) continue;
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
    referredProfessionals: referredUsers.map((user) => {
      const accountType =
        user.role === "AGENT"
          ? "Agency"
          : user.hotelPlan
            ? "Hotel"
            : "Professional";
      const tier =
        user.hotelPlan?.tier ??
        user.subscriptions[0]?.plan ??
        null;

      return {
        id: user.id,
        name: user.agentProfile?.agencyName ?? user.name,
        email: user.email,
        role: user.role,
        accountType,
        tier,
        joinedAt: user.createdAt.toISOString(),
        planPayments: paymentStats.get(user.id)?.count ?? 0,
        commissionEarned: commissionTotals.get(user.id) ?? 0,
      };
    }),
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

export async function getAdminJobPartnerSummary() {
  const [partners, referredCount, pendingWithdrawals, commissionSum, walletSample] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "JOB_PARTNER" },
        select: { isActive: true, jobPartnerProfile: { select: { hotelsReferred: true } } },
      }),
      prisma.user.count({ where: { referredByJobPartnerUserId: { not: null } } }),
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
      prisma.professionalWallet.findFirst({
        where: { user: { role: "JOB_PARTNER" } },
        select: { currency: true },
      }),
    ]);

  return {
    totalPartners: partners.length,
    activePartners: partners.filter((p) => p.isActive).length,
    suspendedPartners: partners.filter((p) => !p.isActive).length,
    totalHotelsReferred: referredCount,
    pendingWithdrawalCount: pendingWithdrawals.length,
    pendingWithdrawalAmount: pendingWithdrawals.reduce(
      (sum, row) => sum + row.amount,
      0,
    ),
    totalCommissionsEarned: commissionSum._sum.amount ?? 0,
    currency: walletSample?.currency ?? "KES",
  };
}

export async function getAdminJobPartnersList() {
  const partners = await prisma.user.findMany({
    where: { role: "JOB_PARTNER" },
    orderBy: { createdAt: "desc" },
    include: {
      jobPartnerProfile: true,
      wallet: {
        select: {
          availableBalance: true,
          pendingBalance: true,
          lifetimeEarned: true,
          lifetimePaidOut: true,
          currency: true,
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
      walletTransactions: {
        where: { type: { in: ["HOTEL_RECRUITMENT", "PAYOUT"] } },
        select: { type: true, status: true, amount: true },
      },
    },
  });

  return partners.map((user) => {
    const commissionTotal = user.walletTransactions
      .filter((tx) => tx.type === "HOTEL_RECRUITMENT" && tx.status !== "CANCELLED")
      .reduce((sum, tx) => sum + tx.amount, 0);
    const pendingWithdrawals = user.walletTransactions.filter(
      (tx) => tx.type === "PAYOUT" && tx.status === "PENDING",
    ).length;

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isActive: user.isActive,
      referralCode: user.jobPartnerProfile?.referralCode ?? "",
      hotelsReferred: user.jobPartnerProfile?.hotelsReferred ?? 0,
      joinedAt: user.createdAt.toISOString(),
      availableBalance: user.wallet?.availableBalance ?? 0,
      pendingBalance: user.wallet?.pendingBalance ?? 0,
      lifetimeEarned: user.wallet?.lifetimeEarned ?? 0,
      lifetimePaidOut: user.wallet?.lifetimePaidOut ?? 0,
      currency: user.wallet?.currency ?? "KES",
      pendingWithdrawals,
      commissionTotal,
      payoutLabel: user.wallet
        ? formatPayoutMethod(payoutDetailsFromWallet(user.wallet))
        : "Not set",
    };
  });
}

export async function getAdminReferredHotelsList() {
  const referred = await prisma.user.findMany({
    where: { referredByJobPartnerUserId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      role: true,
      createdAt: true,
      hotelPlan: { select: { tier: true } },
      agentProfile: { select: { agencyName: true } },
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { plan: true },
      },
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

  const ids = referred.map((row) => row.id);
  const payments =
    ids.length > 0
      ? await prisma.payment.findMany({
          where: { userId: { in: ids }, status: "COMPLETED" },
          select: { userId: true, metadata: true },
        })
      : [];

  const paymentCounts = new Map<string, number>();
  for (const payment of payments) {
    const meta = payment.metadata as { productId?: string } | null;
    if (!isJobPartnerCommissionProduct(meta?.productId)) continue;
    paymentCounts.set(payment.userId, (paymentCounts.get(payment.userId) ?? 0) + 1);
  }

  const commissions = await prisma.walletTransaction.findMany({
    where: { type: "HOTEL_RECRUITMENT", status: { not: "CANCELLED" } },
    select: { amount: true, sourceId: true },
  });
  const paymentIdToUser = new Map(
    (
      await prisma.payment.findMany({
        where: { id: { in: commissions.map((c) => c.sourceId) } },
        select: { id: true, userId: true },
      })
    ).map((p) => [p.id, p.userId]),
  );
  const commissionByUser = new Map<string, number>();
  for (const tx of commissions) {
    const userId = paymentIdToUser.get(tx.sourceId);
    if (!userId) continue;
    commissionByUser.set(userId, (commissionByUser.get(userId) ?? 0) + tx.amount);
  }

  return referred
    .filter((row) => row.referredByJobPartner)
    .map((row) => ({
      id: row.id,
      name: row.agentProfile?.agencyName ?? row.name,
      email: row.email,
      isActive: row.isActive,
      tier: row.hotelPlan?.tier ?? row.subscriptions[0]?.plan ?? null,
      joinedAt: row.createdAt.toISOString(),
      partnerUserId: row.referredByJobPartner!.id,
      partnerName: row.referredByJobPartner!.name,
      partnerEmail: row.referredByJobPartner!.email,
      partnerReferralCode:
        row.referredByJobPartner!.jobPartnerProfile?.referralCode ?? "",
      planPayments: paymentCounts.get(row.id) ?? 0,
      commissionEarned: commissionByUser.get(row.id) ?? 0,
    }));
}

export async function getAdminJobPartnerDetail(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isActive: true,
      nationalId: true,
      createdAt: true,
      role: true,
      wallet: {
        select: {
          availableBalance: true,
          lifetimeEarned: true,
          currency: true,
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
      jobPartnerProfile: true,
    },
  });

  if (!user || user.role !== "JOB_PARTNER" || !user.jobPartnerProfile) {
    return null;
  }

  const dashboard = await getJobPartnerDashboard(userId);
  if (!dashboard) return null;

  const withdrawals = await prisma.walletTransaction.findMany({
    where: { userId, type: "PAYOUT" },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      description: true,
      createdAt: true,
    },
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
      payoutLabel: user.wallet
        ? formatPayoutMethod(payoutDetailsFromWallet(user.wallet))
        : "Not set",
    },
    profile: dashboard.profile,
    summary: {
      availableBalance: dashboard.summary.availableBalance,
      lifetimeEarned: dashboard.summary.lifetimeEarned,
      monthEarned: dashboard.summary.monthEarned,
      currency: dashboard.summary.currency,
    },
    referredHotels: dashboard.referredProfessionals.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      tier: row.tier,
      joinedAt: row.joinedAt,
      planPayments: row.planPayments,
      commissionEarned: row.commissionEarned,
    })),
    recentCommissions: dashboard.recentCommissions.map((row) => ({
      ...row,
      partnerUserId: userId,
      partnerName: user.name,
      partnerEmail: user.email,
      status: "AVAILABLE",
    })),
    withdrawals: withdrawals.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
