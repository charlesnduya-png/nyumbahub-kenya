import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import {
  canViewWith,
  resolveProfessionalActingContext,
} from "@/lib/account-team";
import { kenyaYearMonth } from "@/lib/kenya-calendar";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  propertyId: z.string().min(1),
  year: z.number().int().min(2020).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
  status: z.enum(["PAID", "UNPAID"]),
  amountPaid: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

async function requireLedgerAccess(write: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ success: false, error: "Sign in required" }, { status: 401 }),
    };
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const isAdmin = session.user.role === "ADMIN";
  const canWrite =
    isAdmin || ctx.permissions.manageListings;
  const canRead =
    canWrite || canViewWith(ctx, "manageListings");

  if (write ? !canWrite : !canRead) {
    return {
      error: NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { session, ctx, canWrite };
}

async function ownedRentalProperty(propertyId: string, ownerId: string) {
  const agent = await prisma.agent.findUnique({
    where: { userId: ownerId },
    select: { id: true },
  });

  return prisma.property.findFirst({
    where: {
      id: propertyId,
      listingType: "RENT",
      OR: [{ ownerId }, ...(agent ? [{ agentId: agent.id }] : [])],
    },
    select: {
      id: true,
      price: true,
      rentalReservations: {
        where: { status: { in: ["APPROVED", "RENTED"] } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { tenantId: true },
      },
    },
  });
}

export async function GET(request: Request) {
  try {
    const gate = await requireLedgerAccess(false);
    if ("error" in gate && gate.error) return gate.error;
    const { ctx, canWrite } = gate;

    const url = new URL(request.url);
    const now = kenyaYearMonth();
    const yearRaw = Number(url.searchParams.get("year"));
    const monthRaw = Number(url.searchParams.get("month"));
    const year =
      Number.isInteger(yearRaw) && yearRaw >= 2020 && yearRaw <= 2100
        ? yearRaw
        : now.year;
    const month =
      Number.isInteger(monthRaw) && monthRaw >= 1 && monthRaw <= 12
        ? monthRaw
        : now.month;

    const ownerId = ctx.actingOwnerId;
    const agent = await prisma.agent.findUnique({
      where: { userId: ownerId },
      select: { id: true },
    });

    const propertyFilter = agent
      ? { OR: [{ ownerId }, { agentId: agent.id }] }
      : { ownerId };

    const houses = await prisma.property.findMany({
      where: {
        ...propertyFilter,
        listingType: "RENT",
        status: "RENTED",
      },
      orderBy: [{ rentalPlot: { name: "asc" } }, { unitLabel: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        unitLabel: true,
        unitFloor: true,
        price: true,
        currency: true,
        town: true,
        estate: true,
        rentalPlot: { select: { id: true, name: true } },
        rentPayments: {
          where: { year, month },
          take: 1,
          select: {
            id: true,
            status: true,
            amountDue: true,
            amountPaid: true,
            paidAt: true,
            notes: true,
            tenant: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        rentalReservations: {
          where: { status: { in: ["APPROVED", "RENTED"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            tenant: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    });

    const rows = houses.map((house) => {
      const payment = house.rentPayments[0] ?? null;
      const tenant =
        payment?.tenant ?? house.rentalReservations[0]?.tenant ?? null;
      const paid = payment?.status === "PAID";
      const amountDue = payment?.amountDue ?? house.price;
      const amountPaid = paid ? (payment?.amountPaid ?? amountDue) : 0;

      return {
        propertyId: house.id,
        title: house.title,
        slug: house.slug,
        unitLabel: house.unitLabel,
        unitFloor: house.unitFloor,
        plotName: house.rentalPlot?.name ?? null,
        location: [house.estate, house.town].filter(Boolean).join(", "),
        currency: house.currency,
        amountDue,
        amountPaid,
        status: paid ? ("PAID" as const) : ("UNPAID" as const),
        paidAt: payment?.paidAt?.toISOString() ?? null,
        notes: payment?.notes ?? null,
        tenant: tenant
          ? {
              id: tenant.id,
              name: tenant.name ?? "Tenant",
              email: tenant.email,
              phone: tenant.phone,
            }
          : null,
      };
    });

    const paid = rows.filter((row) => row.status === "PAID");
    const unpaid = rows.filter((row) => row.status === "UNPAID");

    return NextResponse.json({
      success: true,
      canWrite,
      year,
      month,
      summary: {
        rented: rows.length,
        paid: paid.length,
        unpaid: unpaid.length,
        collected: paid.reduce((sum, row) => sum + row.amountPaid, 0),
        outstanding: unpaid.reduce((sum, row) => sum + row.amountDue, 0),
      },
      data: rows,
    });
  } catch (error) {
    console.error("Load rent ledger failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load rent this month" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const gate = await requireLedgerAccess(true);
    if ("error" in gate && gate.error) return gate.error;
    const { session, ctx } = gate;

    const body = await request.json().catch(() => ({}));
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 },
      );
    }

    const now = kenyaYearMonth();
    const year = parsed.data.year ?? now.year;
    const month = parsed.data.month ?? now.month;

    const property = await ownedRentalProperty(parsed.data.propertyId, ctx.actingOwnerId);
    if (!property) {
      return NextResponse.json({ success: false, error: "House not found" }, { status: 404 });
    }

    const tenantId = property.rentalReservations[0]?.tenantId ?? null;
    const paid = parsed.data.status === "PAID";
    const amountPaid = paid
      ? parsed.data.amountPaid ?? property.price
      : 0;

    const payment = await prisma.rentalRentPayment.upsert({
      where: {
        propertyId_year_month: {
          propertyId: property.id,
          year,
          month,
        },
      },
      create: {
        propertyId: property.id,
        tenantId,
        year,
        month,
        amountDue: property.price,
        amountPaid,
        status: parsed.data.status,
        paidAt: paid ? new Date() : null,
        notes: parsed.data.notes?.trim() || null,
        markedById: session.user.id,
      },
      update: {
        tenantId,
        amountDue: property.price,
        amountPaid,
        status: parsed.data.status,
        paidAt: paid ? new Date() : null,
        notes: parsed.data.notes?.trim() || null,
        markedById: session.user.id,
      },
    });

    try {
      const { syncRentWallet } = await import("@/lib/wallet");
      await syncRentWallet(prisma, payment.id);
    } catch (walletError) {
      console.error("Rent wallet sync failed:", walletError);
    }

    return NextResponse.json({
      success: true,
      data: {
        propertyId: payment.propertyId,
        status: payment.status,
        amountPaid: payment.amountPaid,
        paidAt: payment.paidAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error("Update rent ledger failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to update rent status" },
      { status: 500 },
    );
  }
}
