import { notFound, redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import {
  canViewPlots,
  resolveProfessionalActingContext,
} from "@/lib/account-team";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProViewListingPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/pro/plots");
  }

  const { id } = await params;
  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (!canViewPlots(ctx) && session.user.role !== "ADMIN") {
    redirect("/dashboard/pro/plots");
  }

  const property = await prisma.property.findFirst({
    where: {
      id,
      OR: [
        { ownerId: ctx.actingOwnerId },
        { rentalPlot: { ownerId: ctx.actingOwnerId } },
      ],
    },
    select: { slug: true },
  });

  if (!property?.slug) {
    notFound();
  }

  redirect(`/properties/${property.slug}`);
}
