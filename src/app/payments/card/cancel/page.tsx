"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

function CancelBody() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentId = params.get("paymentId");

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace("/pricing?pesapal=cancelled");
    }, 2500);
    return () => window.clearTimeout(t);
  }, [router]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <BrandLogo href="/" showWordmark size="md" />
      <h1 className="font-display text-2xl font-semibold">Payment cancelled</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Your card payment was cancelled. No charge was made
        {paymentId ? ` (ref ${paymentId.slice(0, 8)}…)` : ""}.
      </p>
      <Button asChild>
        <Link href="/pricing">Back to pricing</Link>
      </Button>
    </main>
  );
}

export default function CardPaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
          Closing checkout…
        </main>
      }
    >
      <CancelBody />
    </Suspense>
  );
}
