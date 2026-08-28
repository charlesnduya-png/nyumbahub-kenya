"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Clock3, Lock } from "lucide-react";
import { toast } from "sonner";

import { PaymentCheckout } from "@/components/payments/payment-checkout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TENANT_ACCESS_HOURS,
  TENANT_ACCESS_PRICE,
  TENANT_ACCESS_PRODUCT_ID,
} from "@/lib/pricing";
import { TENANT_ACCESS_REQUIRED } from "@/lib/listing-flags";

type AccessState = {
  loading: boolean;
  required: boolean;
  active: boolean;
  endsAt: string | null;
};

const defaultState: AccessState = {
  loading: TENANT_ACCESS_REQUIRED,
  required: TENANT_ACCESS_REQUIRED,
  active: !TENANT_ACCESS_REQUIRED,
  endsAt: null,
};

export function useTenantAccess() {
  const { status, data: session } = useSession();
  const [state, setState] = useState<AccessState>(defaultState);

  const refresh = useCallback(async () => {
    if (status === "unauthenticated") {
      setState({
        loading: false,
        required: true,
        active: false,
        endsAt: null,
      });
      return;
    }
    if (status !== "authenticated") return;

    try {
      const res = await fetch("/api/tenant-access");
      const json = await res.json();
      if (json.success && json.data) {
        setState({
          loading: false,
          required: Boolean(json.data.required),
          active: Boolean(json.data.active),
          endsAt: json.data.endsAt ?? null,
        });
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, [status]);

  useEffect(() => {
    void refresh();
  }, [refresh, session?.user?.id]);

  const canContact = !state.required || state.active;

  return { ...state, canContact, refresh, authStatus: status };
}

interface TenantAccessPaywallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
  actionLabel?: string;
}

export function TenantAccessPaywall({
  open,
  onOpenChange,
  onUnlocked,
  actionLabel = "chat, reserve, or call",
}: TenantAccessPaywallProps) {
  const { status } = useSession();
  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname : "/properties",
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            24-hour viewing pass
          </DialogTitle>
          <DialogDescription>
            Pay KES {TENANT_ACCESS_PRICE} once to {actionLabel} landlords for{" "}
            {TENANT_ACCESS_HOURS} hours. After that you&apos;ll need to renew.
          </DialogDescription>
        </DialogHeader>

        {status !== "authenticated" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sign in as a tenant, then pay with M-Pesa to unlock contact.
            </p>
            <Button asChild className="w-full">
              <Link href={loginHref}>Sign in to continue</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/30 px-3 py-2 text-sm">
              <p className="font-medium">KES {TENANT_ACCESS_PRICE}</p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5" />
                Valid for {TENANT_ACCESS_HOURS} hours after payment
              </p>
            </div>
            <PaymentCheckout
              embedded
              productId={TENANT_ACCESS_PRODUCT_ID}
              ctaLabel={`Pay KES ${TENANT_ACCESS_PRICE} with M-Pesa`}
              showCard={false}
              onPaid={async (payment) => {
                const res = await fetch("/api/tenant-access", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ paymentId: payment.id }),
                });
                const json = await res.json();
                if (!res.ok || !json.success) {
                  toast.error(json.error ?? "Could not activate viewing pass");
                  return;
                }
                toast.success(
                  json.message ??
                    `Viewing pass active for ${TENANT_ACCESS_HOURS} hours`,
                );
                onOpenChange(false);
                onUnlocked?.();
              }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Wrap a click: if no access, open paywall; else run action. */
export function useTenantContactGate(actionLabel?: string) {
  const access = useTenantAccess();
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(
    null,
  );

  const runWithAccess = useCallback(
    (action: () => void) => {
      if (access.authStatus === "loading") {
        toast.message("Checking your account…");
        return;
      }
      if (access.authStatus === "unauthenticated") {
        const path =
          typeof window !== "undefined" ? window.location.pathname : "/login";
        window.location.href = `/login?callbackUrl=${encodeURIComponent(path)}`;
        return;
      }
      if (!TENANT_ACCESS_REQUIRED) {
        action();
        return;
      }
      if (access.loading) {
        toast.message("Checking viewing pass…");
        return;
      }
      if (!access.canContact) {
        setPendingAction(() => action);
        setPaywallOpen(true);
        return;
      }
      action();
    },
    [access.loading, access.authStatus, access.canContact],
  );

  const paywall = (
    <TenantAccessPaywall
      open={paywallOpen}
      onOpenChange={setPaywallOpen}
      actionLabel={actionLabel}
      onUnlocked={async () => {
        await access.refresh();
        const next = pendingAction;
        setPendingAction(null);
        next?.();
      }}
    />
  );

  return { ...access, runWithAccess, paywall, setPaywallOpen };
}

export function TenantAccessBanner() {
  const access = useTenantAccess();
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (access.loading) return null;

  if (!access.required || access.active) {
    return access.active && access.endsAt ? (
      <p className="text-xs text-muted-foreground">
        Viewing pass active until{" "}
        {new Date(access.endsAt).toLocaleString("en-KE", {
          hour: "2-digit",
          minute: "2-digit",
          day: "numeric",
          month: "short",
        })}
      </p>
    ) : null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setPaywallOpen(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-sm"
      >
        <Lock className="h-4 w-4 shrink-0" />
        <span>
          KES {TENANT_ACCESS_PRICE} unlocks chat, reserve &amp; call for{" "}
          {TENANT_ACCESS_HOURS} hours — tap to pay
        </span>
      </button>
      <TenantAccessPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        onUnlocked={() => void access.refresh()}
      />
    </>
  );
}
