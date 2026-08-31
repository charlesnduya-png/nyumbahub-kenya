import Link from "next/link";
import {
  Banknote,
  Building2,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { ReferralLinkCard } from "@/components/job-partner/referral-link-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import {
  getJobPartnerDashboard,
  HOTEL_RECRUITMENT_COMMISSION_RATE,
} from "@/lib/job-partner";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

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

  const commissionPct = Math.round(HOTEL_RECRUITMENT_COMMISSION_RATE * 100);

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
      hint: `Hotel plan commissions (${commissionPct}%)`,
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
      label: "Hotels referred",
      value: String(data.profile.hotelsReferred),
      hint: "Operators who joined via your link",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job partner dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Bring hotels onboard and earn {commissionPct}% of their monthly plan
            payments — tracked automatically in your wallet.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/jobs/wallet">
            <Wallet className="mr-2 h-4 w-4" />
            Open wallet
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
              </div>
              <stat.icon className="h-8 w-8 text-primary/70" />
            </CardContent>
          </Card>
        ))}
      </div>

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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Referred hotels
          </CardTitle>
          <Badge variant="secondary">{data.referredHotels.length} total</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.referredHotels.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hotels yet. Send your referral link to property owners who want
              to list hotels on Your Home.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Hotel / operator</th>
                  <th className="pb-3 pr-4 font-medium">Plan</th>
                  <th className="pb-3 pr-4 font-medium">Joined</th>
                  <th className="pb-3 pr-4 font-medium">Plan payments</th>
                  <th className="pb-3 font-medium">Your commission</th>
                </tr>
              </thead>
              <tbody>
                {data.referredHotels.map((hotel) => (
                  <tr key={hotel.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{hotel.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{hotel.email}</p>
                    </td>
                    <td className="py-3 pr-4 capitalize">
                      {hotel.tier?.replace(/_/g, " ") ?? "Not subscribed"}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatRelativeDate(new Date(hotel.joinedAt))}
                    </td>
                    <td className="py-3 pr-4">{hotel.planPayments}</td>
                    <td className="py-3 font-medium">
                      {formatPrice(hotel.commissionEarned, {
                        currency: data.summary.currency,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent commissions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {data.recentCommissions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Commissions appear here when a referred hotel pays their monthly
              plan.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">When</th>
                  <th className="pb-3 pr-4 font-medium">Details</th>
                  <th className="pb-3 pr-4 font-medium">Plan payment</th>
                  <th className="pb-3 font-medium">You earned</th>
                </tr>
              </thead>
              <tbody>
                {data.recentCommissions.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">
                      {formatRelativeDate(new Date(row.createdAt))}
                    </td>
                    <td className="py-3 pr-4">{row.description}</td>
                    <td className="py-3 pr-4">
                      {formatPrice(row.grossAmount, { currency: row.currency })}
                    </td>
                    <td className="py-3 font-medium text-primary">
                      +{formatPrice(row.amount, { currency: row.currency })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
