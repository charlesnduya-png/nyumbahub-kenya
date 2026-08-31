"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReferralLinkCard({
  referralCode,
  referralUrl,
}: {
  referralCode: string;
  referralUrl: string;
}) {
  const [copied, setCopied] = useState<"code" | "url" | null>(null);

  async function copy(value: string, kind: "code" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "code" ? "Referral code copied" : "Referral link copied");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-primary/5 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Link2 className="h-4 w-4 text-primary" />
        Your referral link
      </div>
      <p className="text-sm text-muted-foreground">
        Share this link with hotel operators. When they sign up and pay their
        monthly hotel plan, you earn 30% of each payment — every month they stay
        subscribed.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input readOnly value={referralCode} className="font-mono text-sm" />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => copy(referralCode, "code")}
        >
          {copied === "code" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy code
        </Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input readOnly value={referralUrl} className="text-sm" />
        <Button
          type="button"
          className="shrink-0"
          onClick={() => copy(referralUrl, "url")}
        >
          {copied === "url" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          Copy link
        </Button>
      </div>
    </div>
  );
}
