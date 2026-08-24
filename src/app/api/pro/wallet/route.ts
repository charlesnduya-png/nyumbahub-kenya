import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { prisma } from "@/lib/prisma";
import { africanCountrySchema } from "@/lib/african-countries";
import { getWalletOverview, updateWalletPayoutMethod } from "@/lib/wallet";

function canViewWallet(ctx: {
  isTeamMember: boolean;
  permissions: {
    manageTeam: boolean;
    manageBookings: boolean;
    manageListings: boolean;
  };
}) {
  return (
    !ctx.isTeamMember ||
    ctx.permissions.manageTeam ||
    ctx.permissions.manageBookings ||
    ctx.permissions.manageListings
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  try {
    const ctx = await resolveProfessionalActingContext(session.user.id);
    if (!canViewWallet(ctx)) {
      return NextResponse.json(
        { success: false, error: "Wallet access required" },
        { status: 403 },
      );
    }

    const data = await getWalletOverview(prisma, ctx.actingOwnerId);
    return NextResponse.json({
      success: true,
      data: { ...data, canEdit: !ctx.isTeamMember || ctx.permissions.manageTeam },
    });
  } catch (error) {
    console.error("Load wallet failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to load wallet" },
      { status: 500 },
    );
  }
}

const payoutSchema = z
  .object({
    method: z.enum(["MOBILE_MONEY", "BANK", "DIGITAL_WALLET"]),
    country: africanCountrySchema,
    accountName: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(30).optional().default(""),
    provider: z.string().trim().max(60).optional().default(""),
    bankName: z.string().trim().max(80).optional().default(""),
    bankAccount: z.string().trim().max(40).optional().default(""),
    bankBranch: z.string().trim().max(80).optional().default(""),
    swift: z.string().trim().max(20).optional().default(""),
    email: z.string().trim().max(120).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (data.method === "MOBILE_MONEY") {
      const digits = data.phone.replace(/\D/g, "");
      if (digits.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the mobile money number we should send payouts to",
          path: ["phone"],
        });
      }
    }
    if (data.method === "BANK") {
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the bank name",
          path: ["bankName"],
        });
      }
      if (!data.bankAccount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the bank account number or IBAN",
          path: ["bankAccount"],
        });
      }
    }
    if (data.method === "DIGITAL_WALLET") {
      const emailOk = Boolean(data.email && data.email.includes("@"));
      const digits = data.phone.replace(/\D/g, "");
      if (!emailOk && digits.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Enter the wallet email or phone number",
          path: ["email"],
        });
      }
    }
  });

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Sign in required" },
      { status: 401 },
    );
  }

  try {
    const ctx = await resolveProfessionalActingContext(session.user.id);
    const canEdit = !ctx.isTeamMember || ctx.permissions.manageTeam;
    if (!canEdit) {
      return NextResponse.json(
        { success: false, error: "Only the account owner can set a payout method" },
        { status: 403 },
      );
    }

    const parsed = payoutSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message ?? "Check the payout details",
        },
        { status: 400 },
      );
    }

    await updateWalletPayoutMethod(prisma, ctx.actingOwnerId, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save payout method failed:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save payout method" },
      { status: 500 },
    );
  }
}
