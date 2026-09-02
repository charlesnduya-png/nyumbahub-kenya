import Link from "next/link";
import { Banknote, Clock3, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayoutMethodForm } from "@/components/professional/payout-method-form";
import { WalletWithdrawForm } from "@/components/professional/wallet-withdraw-form";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
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
  if (type === "BOOKING") return "BnB booking";
  if (type === "RENT") return "Rent collected";
  if (type === "SALE") return "Sale offer";
  if (type === "PAYOUT") return "Withdrawal";
  if (type === "HOTEL_RECRUITMENT") return "Partner referral";
  return "Adjustment";
}

export default async function ProfessionalWalletPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const { summary, payout, transactions } = await getWalletOverview(
    prisma,
    ctx.actingOwnerId,
  );
  const canEdit = !ctx.isTeamMember || ctx.permissions.manageTeam;

  const stats = [
    {
      label: "Available balance",
      value: formatPrice(summary.availableBalance, { currency: summary.currency }),
      hint: "Cleared earnings ready to pay out",
      icon: Wallet,
    },
    {
      label: "Pending payments",
      value: formatPrice(summary.pendingBalance, { currency: summary.currency }),
      hint: "Approved bookings and accepted offers not yet cleared",
      icon: Clock3,
    },
    {
      label: "Total earned",
      value: formatPrice(summary.lifetimeEarned, { currency: summary.currency }),
      hint: "All cleared money you have made on Your Home",
      icon: TrendingUp,
    },
    {
      label: "Paid out",
      value: formatPrice(summary.lifetimePaidOut, { currency: summary.currency }),
      hint: "Amount already sent to you",
      icon: Banknote,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Wallet</h1>
        <p className="mt-1 text-muted-foreground">
          Track earnings, set how you get paid, and request a withdrawal.
        </p>
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

      <Card id="payout-method">
        <CardHeader>
          <CardTitle>Payout method</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Choose your country, then save mobile money, a local bank account,
            or a digital wallet. Providers change with the country — M-Pesa in
            Kenya, MTN MoMo in Ghana, Wave in Senegal, EcoCash in Zimbabwe, and
            so on.
          </p>
          <PayoutMethodForm initial={payout} canEdit={canEdit} />
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
            canEdit={canEdit}
            hasPayoutMethod={Boolean(payout.method)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How money lands here</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Approved BnB and hotel stays add a pending payment (90% after the 10% platform
            fee). It clears to your balance after checkout, or when you mark the
            stay complete.
          </p>
          <p>
            Rent marked paid on Rent management is added to your balance.
            Accepted sale offers stay pending until the listing is marked sold.
          </p>
          <p>
            <Link href="/dashboard/pro/bookings" className="text-primary hover:underline">
              BnB bookings
            </Link>
            {" · "}
            <Link href="/dashboard/pro/hotels/bookings" className="text-primary hover:underline">
              Hotel bookings
            </Link>
            {" · "}
            <Link href="/dashboard/pro/rent" className="text-primary hover:underline">
              Rent management
            </Link>
            {" · "}
            <Link href="/dashboard/pro/offers" className="text-primary hover:underline">
              Offers
            </Link>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No wallet activity yet. Approve a BnB booking or mark rent paid to
              see earnings here.
            </p>
          ) : (
            <table className="w-full text-sm">
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
                      {row.feeAmount > 0 ? (
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          (fee {formatPrice(row.feeAmount, { currency: row.currency })})
                        </span>
                      ) : null}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
