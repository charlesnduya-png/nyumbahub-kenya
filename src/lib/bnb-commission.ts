import type { Prisma, PrismaClient } from "@prisma/client";
import { escrowIsConnected, splitBnbPayment } from "@/lib/bnb-split";

type Db = PrismaClient | Prisma.TransactionClient;

export async function syncPlatformCommission(db: Db, bookingId: string) {
  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: {
        select: {
          ownerId: true,
          agent: { select: { userId: true } },
        },
      },
    },
  });
  if (!booking) return null;

  const hostUserId = booking.property.agent?.userId ?? booking.property.ownerId;
  const split = splitBnbPayment(booking.totalAmount);
  const storedHost = booking.hostAmount > 0 ? booking.hostAmount : split.hostAmount;
  const storedFee =
    booking.commissionAmount > 0 ? booking.commissionAmount : split.commissionAmount;

  let nextStatus: "ACCRUED" | "COLLECTED" | "CANCELLED" | "REFUNDED" = "CANCELLED";
  if (booking.status === "APPROVED") {
    nextStatus = "ACCRUED";
  } else if (booking.status === "COMPLETED") {
    nextStatus = escrowIsConnected() ? "COLLECTED" : "ACCRUED";
  }

  if (
    booking.commissionAmount !== storedFee ||
    booking.hostAmount !== storedHost
  ) {
    await db.booking.update({
      where: { id: booking.id },
      data: {
        commissionAmount: storedFee,
        hostAmount: storedHost,
      },
    });
  }

  const existing = await db.platformCommission.findUnique({
    where: { bookingId: booking.id },
  });

  if (booking.status === "PENDING") {
    if (existing && existing.status !== "CANCELLED") {
      await db.platformCommission.update({
        where: { id: existing.id },
        data: { status: "CANCELLED", collectedAt: null },
      });
    }
    return existing;
  }

  if (booking.status === "REJECTED" || booking.status === "CANCELLED") {
    if (!existing) return null;
    await db.platformCommission.update({
      where: { id: existing.id },
      data: {
        status: existing.status === "COLLECTED" ? "REFUNDED" : "CANCELLED",
        collectedAt: null,
      },
    });
    return existing;
  }

  const data = {
    hostUserId,
    guestUserId: booking.guestId,
    grossAmount: split.grossAmount,
    commissionAmount: storedFee,
    hostAmount: storedHost,
    currency: booking.currency,
    status: nextStatus,
    collectedAt: nextStatus === "COLLECTED" ? new Date() : null,
  };

  if (existing) {
    return db.platformCommission.update({
      where: { id: existing.id },
      data,
    });
  }

  return db.platformCommission.create({
    data: {
      bookingId: booking.id,
      ...data,
    },
  });
}

export async function getAdminBnbCommissionSummary(db: PrismaClient) {
  const earned = await db.platformCommission.aggregate({
    where: { status: { in: ["ACCRUED", "COLLECTED"] } },
    _sum: { commissionAmount: true, hostAmount: true, grossAmount: true },
    _count: { _all: true },
  });

  const rows = await db.platformCommission.findMany({
    orderBy: { createdAt: "desc" },
    take: 80,
    include: {
      host: { select: { name: true, email: true, role: true } },
      booking: {
        select: {
          status: true,
          checkIn: true,
          checkOut: true,
          property: { select: { title: true } },
        },
      },
    },
  });

  return {
    bookingCount: earned._count._all,
    commissionEarned: earned._sum.commissionAmount ?? 0,
    hostShare: earned._sum.hostAmount ?? 0,
    grossBooked: earned._sum.grossAmount ?? 0,
    rows: rows.map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      status: row.status,
      bookingStatus: row.booking.status,
      propertyTitle: row.booking.property.title,
      hostName: row.host.name,
      hostEmail: row.host.email,
      hostRole: row.host.role,
      grossAmount: row.grossAmount,
      commissionAmount: row.commissionAmount,
      hostAmount: row.hostAmount,
      currency: row.currency,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
