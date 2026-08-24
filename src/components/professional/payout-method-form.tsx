"use client";

import { useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { CountrySelect } from "@/components/properties/country-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DIGITAL_WALLET_PROVIDERS,
  dialCodeForCountry,
  mobileMoneyProvidersFor,
} from "@/lib/africa-payouts";
import { DEFAULT_LISTING_COUNTRY } from "@/lib/african-countries";
import type { WalletPayoutDetails } from "@/lib/wallet";

type PayoutMethod = "MOBILE_MONEY" | "BANK" | "DIGITAL_WALLET";

export function PayoutMethodForm({
  initial,
  canEdit,
}: {
  initial: WalletPayoutDetails;
  canEdit: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [country, setCountry] = useState(
    initial.country || DEFAULT_LISTING_COUNTRY,
  );
  const [method, setMethod] = useState<PayoutMethod>(
    initial.method ?? "MOBILE_MONEY",
  );
  const [accountName, setAccountName] = useState(initial.accountName);
  const [phone, setPhone] = useState(initial.phone);
  const [provider, setProvider] = useState(initial.provider || "M-Pesa");
  const [bankName, setBankName] = useState(initial.bankName);
  const [bankAccount, setBankAccount] = useState(initial.bankAccount);
  const [bankBranch, setBankBranch] = useState(initial.bankBranch);
  const [swift, setSwift] = useState(initial.swift);
  const [email, setEmail] = useState(initial.email);

  const mobileProviders = useMemo(
    () => mobileMoneyProvidersFor(country),
    [country],
  );
  const dialCode = dialCodeForCountry(country);

  function changeCountry(next: string) {
    setCountry(next);
    const nextProviders = mobileMoneyProvidersFor(next);
    if (method === "MOBILE_MONEY" && !nextProviders.includes(provider)) {
      setProvider(nextProviders[0] ?? "Other");
    }
  }

  async function save() {
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/pro/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          country,
          accountName,
          phone,
          provider,
          bankName,
          bankAccount,
          bankBranch,
          swift,
          email,
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="payout-country">Country</Label>
          <CountrySelect
            id="payout-country"
            value={country}
            onValueChange={changeCountry}
            disabled={!canEdit}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="payout-method">How should we pay you?</Label>
          <select
            id="payout-method"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={method}
            disabled={!canEdit}
            onChange={(e) => setMethod(e.target.value as PayoutMethod)}
          >
            <option value="MOBILE_MONEY">
              Mobile money (M-Pesa, MoMo, Wave, EcoCash…)
            </option>
            <option value="BANK">Bank transfer</option>
            <option value="DIGITAL_WALLET">
              Digital wallet (PayPal, Wise, Chipper Cash…)
            </option>
          </select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="payout-name">Account name</Label>
        <Input
          id="payout-name"
          value={accountName}
          disabled={!canEdit}
          placeholder="Name on the phone, bank, or wallet"
          onChange={(e) => setAccountName(e.target.value)}
        />
      </div>

      {method === "MOBILE_MONEY" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="payout-provider">Mobile money provider</Label>
            <select
              id="payout-provider"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={mobileProviders.includes(provider) ? provider : "Other"}
              disabled={!canEdit}
              onChange={(e) => setProvider(e.target.value)}
            >
              {mobileProviders.map((item) => (
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
              placeholder={`${dialCode} …`}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Include the country code ({dialCode}) if the number is not local.
            </p>
          </div>
        </div>
      ) : null}

      {method === "BANK" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="payout-bank">Bank name</Label>
            <Input
              id="payout-bank"
              value={bankName}
              disabled={!canEdit}
              placeholder="Local bank in this country"
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-account">Account number / IBAN</Label>
            <Input
              id="payout-account"
              value={bankAccount}
              disabled={!canEdit}
              onChange={(e) => setBankAccount(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-branch">Branch (optional)</Label>
            <Input
              id="payout-branch"
              value={bankBranch}
              disabled={!canEdit}
              onChange={(e) => setBankBranch(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-swift">SWIFT / BIC (optional)</Label>
            <Input
              id="payout-swift"
              value={swift}
              disabled={!canEdit}
              placeholder="For cross-border transfers"
              onChange={(e) => setSwift(e.target.value)}
            />
          </div>
        </div>
      ) : null}

      {method === "DIGITAL_WALLET" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="payout-digital">Wallet</Label>
            <select
              id="payout-digital"
              className="h-10 rounded-md border bg-background px-3 text-sm"
              value={provider}
              disabled={!canEdit}
              onChange={(e) => setProvider(e.target.value)}
            >
              {DIGITAL_WALLET_PROVIDERS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payout-email">Email on the wallet</Label>
            <Input
              id="payout-email"
              type="email"
              value={email}
              disabled={!canEdit}
              placeholder="name@email.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="payout-wallet-phone">Phone on the wallet (optional)</Label>
            <Input
              id="payout-wallet-phone"
              value={phone}
              disabled={!canEdit}
              placeholder={`${dialCode} …`}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
      ) : null}

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
