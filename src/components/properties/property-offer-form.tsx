"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { HandCoins, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";

interface PropertyOfferFormProps {
  propertyId: string;
  propertyTitle: string;
  listedPrice: number;
  currency?: string;
}

export function PropertyOfferForm({
  propertyId,
  propertyTitle,
  listedPrice,
  currency = "KES",
}: PropertyOfferFormProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const { runWithAccess, paywall } = useTenantContactGate("make an offer");

  async function submit() {
    const value = Number(amount.replace(/,/g, ""));

    if (!value || value <= 0) {
      toast.error("Enter a valid offer amount");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: value,
          currency,
          message: message.trim() || undefined,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        if (json.code === "TENANT_ACCESS_REQUIRED") {
          toast.error(json.error ?? "Viewing pass required");
          setOpen(false);
          runWithAccess(() => setOpen(true));
          return;
        }
        toast.error(json.error ?? "Could not submit offer");
        return;
      }

      toast.success(json.message ?? "Offer sent to the owner");
      setOpen(false);
      setAmount("");
      setMessage("");
    } catch {
      toast.error("Could not submit offer");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return (
      <Button variant="secondary" className="w-full" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading…
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Button variant="secondary" className="w-full" asChild>
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
        >
          <HandCoins className="mr-2 h-4 w-4" />
          Sign in to make an offer
        </Link>
      </Button>
    );
  }

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          runWithAccess(() => setOpen(true));
          return;
        }
        setOpen(false);
      }}
    >
      <Button
        variant="secondary"
        className="w-full"
        onClick={() => runWithAccess(() => setOpen(true))}
      >
        <HandCoins className="mr-2 h-4 w-4" />
        Make an offer
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Your offer</DialogTitle>
          <DialogDescription>
            Submit your price for {propertyTitle}. Listed at{" "}
            {formatPrice(listedPrice, { currency })}. The owner will review and
            respond in their dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offer-amount">Offer amount ({currency})</Label>
            <Input
              id="offer-amount"
              inputMode="numeric"
              placeholder={listedPrice.toLocaleString("en-KE")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-message">Message (optional)</Label>
            <Textarea
              id="offer-message"
              placeholder="Cash buyer, ready to close in 14 days…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Submit offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {paywall}
    </>
  );
}
