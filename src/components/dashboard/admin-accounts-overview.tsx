import Link from "next/link";
import {
  Briefcase,
  Shield,
  UserCheck,
  UserRound,
  Users,
} from "lucide-react";
import type { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ACCOUNT_TYPE_LABELS,
  type AccountTypeCounts,
} from "@/lib/admin-growth";

const ROLE_ICONS: Record<Role, React.ComponentType<{ className?: string }>> = {
  BUYER: UserRound,
  AGENT: UserCheck,
  SELLER: Users,
  ADMIN: Shield,
  JOB_PARTNER: Briefcase,
};

const ROLE_ORDER: Role[] = ["BUYER", "AGENT", "SELLER", "JOB_PARTNER", "ADMIN"];

export function AdminAccountsOverview({
  accounts,
  activeAccounts,
}: {
  accounts: AccountTypeCounts;
  activeAccounts: AccountTypeCounts;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Accounts by type</h2>
        <p className="text-sm text-muted-foreground">
          {accounts.total.toLocaleString("en-KE")} total accounts ·{" "}
          {activeAccounts.total.toLocaleString("en-KE")} active
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ROLE_ORDER.map((role) => {
          const meta = ACCOUNT_TYPE_LABELS[role];
          const Icon = ROLE_ICONS[role];
          const count = accounts[role];
          const active = activeAccounts[role];
          const tab =
            role === "BUYER"
              ? "tenants"
              : role === "AGENT"
                ? "agents"
                : role === "SELLER"
                  ? "landlords"
                  : "admins";

          return (
            <Link
              key={role}
              href={`/dashboard/admin/users?tab=${tab}`}
              className="block"
            >
              <Card className="h-full transition hover:border-primary/40 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {meta.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold tabular-nums">
                    {count.toLocaleString("en-KE")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {meta.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{active} active</Badge>
                    {count - active > 0 ? (
                      <Badge variant="outline">{count - active} suspended</Badge>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
