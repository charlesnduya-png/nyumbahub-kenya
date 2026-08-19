import { prisma } from "@/lib/prisma";

export interface AdminVerificationAgent {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string | null;
  agency: string;
  licenseNumber: string | null;
  county: string;
  listingsCount: number;
  verificationStatus: string;
  isVerified: boolean;
  image: string | null;
  createdAt: string;
}

export interface AdminVerificationLandlord {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string | null;
  verificationStatus: string;
  nationalIdVerified: string;
  listingCount: number;
  image: string | null;
  createdAt: string;
}

export async function getAdminVerificationAgents(): Promise<
  AdminVerificationAgent[]
> {
  const agentUsers = await prisma.user.findMany({
    where: { role: "AGENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      phone: true,
      nationalId: true,
      verificationStatus: true,
      createdAt: true,
      agentProfile: {
        select: {
          id: true,
          agencyName: true,
          licenseNumber: true,
          county: true,
          isVerified: true,
          verificationStatus: true,
          _count: { select: { listings: true } },
        },
      },
      _count: { select: { properties: true } },
    },
  });

  return agentUsers.map((u) => {
    const profile = u.agentProfile;
    return {
      id: profile?.id ?? u.id,
      userId: u.id,
      name: u.name ?? "Agent",
      email: u.email,
      phone: u.phone ?? "—",
      nationalId: u.nationalId ?? null,
      agency: profile?.agencyName ?? "Independent",
      licenseNumber: profile?.licenseNumber ?? null,
      county: profile?.county ?? "—",
      listingsCount:
        (profile?._count.listings ?? 0) + u._count.properties,
      verificationStatus:
        profile?.verificationStatus ?? u.verificationStatus,
      isVerified: profile?.isVerified ?? false,
      image: u.image,
      createdAt: u.createdAt.toISOString(),
    };
  });
}

export async function getAdminVerificationLandlords(): Promise<
  AdminVerificationLandlord[]
> {
  const sellers = await prisma.user.findMany({
    where: { role: "SELLER" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      phone: true,
      nationalId: true,
      verificationStatus: true,
      nationalIdVerified: true,
      createdAt: true,
      _count: { select: { properties: true } },
    },
  });

  return sellers.map((u) => ({
    id: u.id,
    name: u.name ?? "Landlord",
    email: u.email,
    phone: u.phone ?? "—",
    nationalId: u.nationalId ?? null,
    verificationStatus: u.verificationStatus,
    nationalIdVerified: u.nationalIdVerified,
    listingCount: u._count.properties,
    image: u.image,
    createdAt: u.createdAt.toISOString(),
  }));
}
