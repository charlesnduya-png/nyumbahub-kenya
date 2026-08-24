"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPrice } from "@/lib/utils";
import type { WalletPayoutDetails } from "@/lib/wallet";

const MIN_WITHDRAWAL = 10;

export function WalletWithdrawForm({
  availableBalance,
  currency,
  payout,
  canEdit,
  hasPayoutMethod,
}: {
  availableBalance: number;
  currency: string;
  payout: WalletPayoutDetails;
  canEdit: boolean;
  hasPayoutMethod: boolean;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pro/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), note }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not request withdrawal");
        return;
      }
      toast.success("Withdrawal requested. Admin will send it to your payout method.");
      setAmount("");
      setNote("");
      router.refresh();
    } catch {
      toast.error("Could not request withdrawal");
    } finally {
      setSaving(false);
    }
  }

  if (!canEdit) {
    return (
      <p className="text-sm text-muted-foreground">
        Only the account owner can request a withdrawal.
      </p>
    );
  }

  if (!hasPayoutMethod) {
    return (
      <p className="text-sm text-muted-foreground">
        Save a payout method above first, then you can withdraw to it.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Available:{" "}
        <span className="font-medium text-foreground">
          {formatPrice(availableBalance, { currency })}
        </span>
        . Money is held until admin pays{" "}
        {payout.provider || payout.bankName || "your payout method"}
        {payout.phone ? ` (${payout.phone})` : payout.email ? ` (${payout.email})` : ""}.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="withdraw-amount">Amount</Label>
          <Input
            id="withdraw-amount"
            type="number"
            min={MIN_WITHDRAWAL}
            step="1"
            value={amount}
            placeholder={`${MIN_WITHDRAWAL} or more`}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="withdraw-note">Note (optional)</Label>
          <Input
            id="withdraw-note"
            value={note}
            placeholder="e.g. March rent share"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      <Button
        onClick={() => void submit()}
        disabled={saving || !amount || Number(amount) < MIN_WITHDRAWAL}
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Request withdrawal
      </Button>
    </div>
  );
}
