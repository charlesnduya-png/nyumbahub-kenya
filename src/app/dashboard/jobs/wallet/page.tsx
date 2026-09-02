import Link from "next/link";
import { Banknote, Clock3, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobPartnerCommissionsList } from "@/components/job-partner/job-partner-commissions-list";
import { JobPartnerEarningsInfo } from "@/components/job-partner/job-partner-earnings-info";
import { PayoutMethodForm } from "@/components/professional/payout-method-form";
import { WalletWithdrawForm } from "@/components/professional/wallet-withdraw-form";
import { auth } from "@/lib/auth";
import { jobPartnerCommissionPercent } from "@/lib/job-partner-copy";
import { prisma } from "@/lib/prisma";
import { formatPrice, formatRelativeDate } from "@/lib/utils";
import { getWalletOverview } from "@/lib/wallet";

function statusLabel(status: string, type?: string) {
  if (type === "PAYOUT" && status === "PENDING") return "Withdrawal requested";
  if (status === "PENDING") return "Pending";
  if (status === "AVAILABLE") return "Cleared";
  if (status === "PAID_OUT") return "Paid out";
  return "Cancelled";
}

function typeLabel(type: string) {
  if (type === "HOTEL_RECRUITMENT") return "Partner referral";
  if (type === "PAYOUT") return "Withdrawal";
  return "Adjustment";
}

export default async function JobPartnerWalletPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { summary, payout, transactions } = await getWalletOverview(
    prisma,
    session.user.id,
  );

  const commissionPct = jobPartnerCommissionPercent();

  const stats = [
    {
      label: "Available balance",
      value: formatPrice(summary.availableBalance, { currency: summary.currency }),
      hint: "Commissions ready to withdraw",
      icon: Wallet,
    },
    {
      label: "Pending",
      value: formatPrice(summary.pendingBalance, { currency: summary.currency }),
      hint: "Awaiting clearance",
      icon: Clock3,
    },
    {
      label: "Total earned",
      value: formatPrice(summary.lifetimeEarned, { currency: summary.currency }),
      hint: "Agency & hotel referral commissions",
      icon: TrendingUp,
    },
    {
      label: "Paid out",
      value: formatPrice(summary.lifetimePaidOut, { currency: summary.currency }),
      hint: "Already sent to you",
      icon: Banknote,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="mt-1 text-muted-foreground">
            You earn {commissionPct}% when referred agencies or hotels pay their
            monthly plan. Commissions land here immediately — withdraw anytime.
          </p>
        </div>
        <Button variant="outline" asChild className="w-full shrink-0 sm:w-auto">
          <Link href="/dashboard/jobs">Back to dashboard</Link>
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
          <CardTitle>When you earn</CardTitle>
        </CardHeader>
        <CardContent>
          <JobPartnerEarningsInfo />
        </CardContent>
      </Card>

      <Card id="payout-method">
        <CardHeader>
          <CardTitle>Payout method</CardTitle>
        </CardHeader>
        <CardContent>
          <PayoutMethodForm initial={payout} canEdit />
        </CardContent>
      </Card>

      <Card id="withdraw">
        <CardHeader>
          <CardTitle>Withdraw</CardTitle>
        </CardHeader>
        <CardContent>
          <WalletWithdrawForm
            availableBalance={summary.availableBalance}
            currency={summary.currency}
            payout={payout}
            canEdit
            hasPayoutMethod={Boolean(payout.method)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No wallet activity yet. Share your referral link from the{" "}
              <Link href="/dashboard/jobs" className="text-primary hover:underline">
                dashboard
              </Link>{" "}
              to start earning.
            </p>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {transactions.map((row) => (
                  <div
                    key={row.id}
                    className="rounded-xl border bg-card p-4 text-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium">
                        {formatPrice(row.amount, { currency: row.currency })}
                      </p>
                      <Badge
                        variant={
                          row.status === "AVAILABLE"
                            ? "default"
                            : row.status === "CANCELLED"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {statusLabel(row.status, row.type)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatRelativeDate(row.createdAt)} · {typeLabel(row.type)}
                    </p>
                    <p className="mt-2 text-muted-foreground">{row.description}</p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">When</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Details</th>
                      <th className="pb-3 pr-4 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatRelativeDate(row.createdAt)}
                        </td>
                        <td className="py-3 pr-4">{typeLabel(row.type)}</td>
                        <td className="py-3 pr-4">{row.description}</td>
                        <td className="py-3 pr-4 font-medium">
                          {formatPrice(row.amount, { currency: row.currency })}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              row.status === "AVAILABLE"
                                ? "default"
                                : row.status === "CANCELLED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {statusLabel(row.status, row.type)}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
