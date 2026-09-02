"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobPartnerCommissionPercent } from "@/lib/job-partner-copy";

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
        Share this link with estate agencies, agents, and hotel operators. When
        they sign up and pay a monthly agency or hotel plan, you earn{" "}
        {jobPartnerCommissionPercent()}% of each payment — credited to your wallet
        right away, and again every month they renew.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          readOnly
          value={referralCode}
          className="min-w-0 font-mono text-sm"
        />
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
        <Input readOnly value={referralUrl} className="min-w-0 text-sm" />
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
