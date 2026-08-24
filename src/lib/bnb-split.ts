import { BNB_BOOKING_COMMISSION_RATE } from "@/lib/pricing";

export type BnbPaymentSplit = {
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  hostAmount: number;
};

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

/** Split a BnB booking total into site commission and host payout. */
export function splitBnbPayment(grossAmount: number): BnbPaymentSplit {
  const gross = roundMoney(Math.max(0, grossAmount));
  const commissionAmount = roundMoney(gross * BNB_BOOKING_COMMISSION_RATE);
  const hostAmount = roundMoney(gross - commissionAmount);
  return {
    grossAmount: gross,
    commissionRate: BNB_BOOKING_COMMISSION_RATE,
    commissionAmount,
    hostAmount,
  };
}

export function bnbCommissionPercent() {
  return Math.round(BNB_BOOKING_COMMISSION_RATE * 100);
}

/** Payment rails that can collect the guest charge and auto-pay the host. */
export type EscrowProviderId = "none" | "mpesa" | "stripe" | "flutterwave";

export function getEscrowProvider(): EscrowProviderId {
  const value = (process.env.ESCROW_PROVIDER ?? "none").toLowerCase();
  if (value === "mpesa" || value === "stripe" || value === "flutterwave") {
    return value;
  }
  return "none";
}

export function escrowIsConnected() {
  return getEscrowProvider() !== "none";
}
