import type { Prisma, PrismaClient, RentalRoomStatus } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/**
 * Keep a multi-room RENT listing ACTIVE while any room is still available.
 * Mark the whole property RENTED only when every room is rented.
 * Single-unit listings (no rooms) are unchanged by this helper.
 */
export async function syncPropertyAvailabilityFromRooms(
  db: Db,
  propertyId: string,
): Promise<{
  hasRooms: boolean;
  availableCount: number;
  totalCount: number;
  propertyStatus: "ACTIVE" | "RENTED" | null;
}> {
  const rooms = await db.propertyRentalRoom.findMany({
    where: { propertyId },
    select: { status: true },
  });

  if (rooms.length === 0) {
    return {
      hasRooms: false,
      availableCount: 0,
      totalCount: 0,
      propertyStatus: null,
    };
  }

  const availableCount = rooms.filter(
    (r: { status: RentalRoomStatus }) => r.status === "AVAILABLE",
  ).length;
  const nextStatus = availableCount > 0 ? "ACTIVE" : "RENTED";

  await db.property.update({
    where: { id: propertyId },
    data: {
      status: nextStatus,
      ...(nextStatus === "ACTIVE"
        ? { publishedAt: new Date(), isVerified: true }
        : {}),
    },
  });

  return {
    hasRooms: true,
    availableCount,
    totalCount: rooms.length,
    propertyStatus: nextStatus,
  };
}

export function summarizeRentalRooms(
  rooms: Array<{ status: RentalRoomStatus }>,
) {
  const total = rooms.length;
  const available = rooms.filter((r) => r.status === "AVAILABLE").length;
  return { total, available, rented: total - available };
}
