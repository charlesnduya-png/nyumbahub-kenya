"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PesapalCardEmbedProps = {
  checkoutUrl: string;
  paymentId: string;
  amountLabel?: string;
  onClose: () => void;
  onComplete: (result: {
    paymentId: string;
    status: string;
    reference?: string;
    amount?: number;
  }) => void;
};

/**
 * Hosts Pesapal card checkout in an iframe inside Your Home chrome
 * so buyers never leave the site for a full-page redirect.
 */
export function PesapalCardEmbed({
  checkoutUrl,
  paymentId,
  amountLabel,
  onClose,
  onComplete,
}: PesapalCardEmbedProps) {
  const [frameLoading, setFrameLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;
    let completed = false;

    async function poll() {
      for (let i = 0; i < 120 && !cancelled && !completed; i += 1) {
        await new Promise((r) => setTimeout(r, 4000));
        if (cancelled || completed) return;
        try {
          const res = await fetch(`/api/payments/${paymentId}/sync`, {
            method: "POST",
          });
          const json = await res.json();
          if (!res.ok || !json.success) continue;
          const status = String(json.data?.status ?? "");
          if (status === "COMPLETED" || status === "FAILED") {
            completed = true;
            setChecking(true);
            onCompleteRef.current({
              paymentId,
              status,
              reference: json.data?.paymentId ?? paymentId,
            });
            return;
          }
        } catch {
          // keep polling
        }
      }
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Card payment"
    >
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandLogo href={null} showWordmark size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Secure card payment</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 shrink-0" />
              Visa / Mastercard · Pesapal
              {amountLabel ? ` · ${amountLabel}` : null}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close card payment"
        >
          <X className="h-5 w-5" />
        </Button>
      </header>

      <div className="relative min-h-0 flex-1 bg-muted/30">
        {frameLoading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Loading secure checkout…
          </div>
        ) : null}
        {checking ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-background/90 text-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            Confirming your payment…
          </div>
        ) : null}
        <iframe
          title="Pesapal card checkout"
          src={checkoutUrl}
          className={cn(
            "h-full w-full border-0 bg-white",
            frameLoading && "opacity-0",
          )}
          allow="payment *"
          onLoad={() => setFrameLoading(false)}
        />
      </div>

      <footer className="border-t bg-card px-4 py-2 text-center text-[11px] text-muted-foreground sm:px-6">
        Payment is processed securely by Pesapal. Your Home never stores your
        card details.
      </footer>
    </div>
  );
}
