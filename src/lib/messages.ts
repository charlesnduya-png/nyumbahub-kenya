import { prisma } from "@/lib/prisma";

/** Agent (if assigned) receives messages and bookings; otherwise the owner. */
export async function getPropertyHostUserId(propertyId: string) {
  const property = await prisma.property.findFirst({
    where: { OR: [{ id: propertyId }, { slug: propertyId }] },
    select: {
      id: true,
      ownerId: true,
      agent: { select: { userId: true } },
    },
  });

  if (!property) return null;

  return {
    propertyId: property.id,
    hostUserId: property.agent?.userId ?? property.ownerId,
  };
}

export function threadPropertyId(propertyId?: string | null) {
  return propertyId ?? null;
}
