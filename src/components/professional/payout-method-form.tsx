"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WalletPayoutDetails } from "@/lib/wallet";

const PROVIDERS = ["M-Pesa", "Airtel Money", "MTN MoMo", "Orange Money", "Other"];

export function PayoutMethodForm({
  initial,
  canEdit,
}: {
  initial: WalletPayoutDetails;
  canEdit: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [method, setMethod] = useState<"MOBILE_MONEY" | "BANK">(
    initial.method ?? "MOBILE_MONEY",
  );
  const [accountName, setAccountName] = useState(initial.accountName);
  const [phone, setPhone] = useState(initial.phone);
  const [provider, setProvider] = useState(initial.provider || "M-Pesa");
  const [bankName, setBankName] = useState(initial.bankName);
  const [bankAccount, setBankAccount] = useState(initial.bankAccount);
  const [bankBranch, setBankBranch] = useState(initial.bankBranch);

  async function save() {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pro/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          accountName,
          phone,
          provider,
          bankName,
          bankAccount,
          bankBranch,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not save payout method");
        return;
      }
      toast.success("Payout method saved");
    } catch {
      toast.error("Could not save payout method");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="payout-method">How should we pay you?</Label>
        <select
          id="payout-method"
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={method}
          disabled={!canEdit}
          onChange={(e) =>
            setMethod(e.target.value as "MOBILE_MONEY" | "BANK")
          }
        >
          <option value="MOBILE_MONEY">Mobile money (M-Pesa, MoMo, Airtel)</option>
          <option value="BANK">Bank account</option>
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="payout-name">Account name</Label>
        <Input
          id="payout-name"
          value={accountName}
          disabled={!canEdit}
          placeholder="Name on the phone or bank account"
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>

      {method === "MOBILE_MONEY" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="payout-provider">Provider</Label>
            <select
              id="payout-provider"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={provider}
              disabled={!canEdit}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-phone">Mobile number</Label>
            <Input
              id="payout-phone"
              value={phone}
              disabled={!canEdit}
              placeholder="e.g. 0712 345 678"
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="payout-bank">Bank name</Label>
            <Input
              id="payout-bank"
              value={bankName}
              disabled={!canEdit}
              placeholder="e.g. Equity, KCB, Absa"
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-account">Account number</Label>
            <Input
              id="payout-account"
              value={bankAccount}
              disabled={!canEdit}
              onChange={(e) => setBankAccount(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payout-branch">Branch (optional)</Label>
            <Input
              id="payout-branch"
              value={bankBranch}
              disabled={!canEdit}
              onChange={(e) => setBankBranch(e.target.value)}
            />
          </div>
        </div>
      )}

      {canEdit ? (
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save payout method
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the account owner can change the payout method.
        </p>
      )}
    </div>
  );
}
