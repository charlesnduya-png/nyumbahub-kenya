import {
  CalendarDays,
  CalendarRange,
  Coins,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AmountSeriesChart } from "@/components/dashboard/amount-series-chart";
import {
  formatKesProfit,
  type AdminRevenueSummary,
} from "@/lib/admin-revenue";

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground">No prior period</span>
    );
  }
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${up ? "text-emerald-600" : "text-red-600"}`}
    >
      <Icon className="h-3 w-3" />
      {up ? "+" : ""}
      {value}% vs prior period
    </span>
  );
}

function ProfitCard({
  title,
  amount,
  subtitle,
  change,
  icon: Icon,
}: {
  title: string;
  amount: number;
  subtitle: string;
  change: number | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">
          {formatKesProfit(amount)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        <div className="mt-2">
          <ChangeBadge value={change} />
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminProfitTracker({ revenue }: { revenue: AdminRevenueSummary }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Profit tracking</h2>
        <p className="text-sm text-muted-foreground">
          Listing fees collected, plus 10% BnB commission earned when a stay is
          approved. Escrow will collect that fee in cash and auto-pay hosts.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ProfitCard
          title="Today"
          amount={revenue.daily}
          subtitle={`${revenue.dailyPayments} payment${revenue.dailyPayments === 1 ? "" : "s"} today`}
          change={revenue.dailyVsYesterday}
          icon={Coins}
        />
        <ProfitCard
          title="This week"
          amount={revenue.weekly}
          subtitle={`${revenue.weeklyPayments} payment${revenue.weeklyPayments === 1 ? "" : "s"} this week`}
          change={revenue.weeklyVsLastWeek}
          icon={CalendarDays}
        />
        <ProfitCard
          title="This month"
          amount={revenue.monthly}
          subtitle={`${revenue.monthlyPayments} payment${revenue.monthlyPayments === 1 ? "" : "s"} this month`}
          change={revenue.monthlyVsLastMonth}
          icon={CalendarRange}
        />
        <ProfitCard
          title="All time"
          amount={revenue.allTime}
          subtitle="Total platform revenue"
          change={null}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProfitCard
          title="BnB commission this month"
          amount={revenue.bnbCommissionMonthly}
          subtitle="10% of approved BnB bookings"
          change={null}
          icon={Coins}
        />
        <ProfitCard
          title="BnB commission all time"
          amount={revenue.bnbCommissionAllTime}
          subtitle={`${revenue.bnbCommissionCount} booking${revenue.bnbCommissionCount === 1 ? "" : "s"} with a platform fee`}
          change={null}
          icon={Wallet}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AmountSeriesChart
          title="Daily profit (last 14 days)"
          subtitle="Amount received each day"
          data={revenue.last14Days.map((d) => ({
            label: d.label,
            value: d.amount,
          }))}
        />
        <AmountSeriesChart
          title="Monthly profit (last 6 months)"
          subtitle="Total completed payments per month"
          data={revenue.last6Months.map((m) => ({
            label: m.label,
            value: m.amount,
          }))}
        />
      </div>
    </div>
  );
}
