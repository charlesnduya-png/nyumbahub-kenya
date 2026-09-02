import Link from "next/link";
import {
  Banknote,
  Building2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { JobPartnerCommissionsList } from "@/components/job-partner/job-partner-commissions-list";
import { JobPartnerEarningsInfo } from "@/components/job-partner/job-partner-earnings-info";
import { ReferralLinkCard } from "@/components/job-partner/referral-link-card";
import { ReferredProfessionalsList } from "@/components/job-partner/referred-professionals-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { jobPartnerCommissionPercent } from "@/lib/job-partner-copy";
import { getJobPartnerDashboard } from "@/lib/job-partner";
import { formatPrice } from "@/lib/utils";

export default async function JobPartnerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getJobPartnerDashboard(session.user.id);
  if (!data) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        Job partner profile not found. Contact support if you just registered.
      </div>
    );
  }

  const commissionPct = jobPartnerCommissionPercent();

  const stats = [
    {
      label: "Available balance",
      value: formatPrice(data.summary.availableBalance, {
        currency: data.summary.currency,
      }),
      hint: "Ready to withdraw",
      icon: Wallet,
    },
    {
      label: "This month",
      value: formatPrice(data.summary.monthEarned, {
        currency: data.summary.currency,
      }),
      hint: `Agency & hotel commissions (${commissionPct}%)`,
      icon: TrendingUp,
    },
    {
      label: "Lifetime earned",
      value: formatPrice(data.summary.lifetimeEarned, {
        currency: data.summary.currency,
      }),
      hint: "All cleared commissions",
      icon: Banknote,
    },
    {
      label: "Referrals",
      value: String(data.profile.hotelsReferred),
      hint: "Agencies & hotels you brought onboard",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Job partner dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Refer agencies and hotel operators. Earn {commissionPct}% every time
            they pay a monthly plan — credited instantly to your wallet.
          </p>
        </div>
        <Button asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/dashboard/jobs/wallet">
            <Wallet className="mr-2 h-4 w-4" />
            Open wallet
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between gap-3 p-5">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <stat.icon className="h-8 w-8 shrink-0 text-primary/70" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>When & how you earn</CardTitle>
        </CardHeader>
        <CardContent>
          <JobPartnerEarningsInfo />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Share & earn</CardTitle>
        </CardHeader>
        <CardContent>
          <ReferralLinkCard
            referralCode={data.profile.referralCode}
            referralUrl={data.profile.referralUrl}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 shrink-0" />
            Referred agencies & hotels
          </CardTitle>
          <Badge variant="secondary">
            {data.referredProfessionals.length} total
          </Badge>
        </CardHeader>
        <CardContent>
          <ReferredProfessionalsList
            rows={data.referredProfessionals.map((row) => ({
              ...row,
              currency: data.summary.currency,
            }))}
            currency={data.summary.currency}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
        </CardHeader>
        <CardContent>
          <JobPartnerCommissionsList rows={data.recentCommissions} />
        </CardContent>
      </Card>
    </div>
  );
}
