import { formatPrice, formatRelativeDate } from "@/lib/utils";

export type ReferredProfessionalRow = {
  id: string;
  name: string | null;
  email: string;
  accountType: string;
  tier: string | null;
  joinedAt: string;
  planPayments: number;
  commissionEarned: number;
  currency: string;
};

function formatTier(tier: string | null) {
  if (!tier) return "Not subscribed";
  return tier.replace(/_/g, " ");
}

export function ReferredProfessionalsList({
  rows,
  currency,
}: {
  rows: ReferredProfessionalRow[];
  currency: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No referrals yet. Send your link to agencies, agents, or hotel operators
        who will subscribe to a paid plan on Your Home.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-xl border bg-card p-4 text-sm shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.name ?? "—"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.email}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                {row.accountType}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted-foreground">Plan</dt>
                <dd className="font-medium capitalize">{formatTier(row.tier)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Joined</dt>
                <dd>{formatRelativeDate(new Date(row.joinedAt))}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Plan payments</dt>
                <dd>{row.planPayments}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Your commission</dt>
                <dd className="font-medium text-primary">
                  {formatPrice(row.commissionEarned, { currency })}
                </dd>
              </div>
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">Agency / operator</th>
              <th className="pb-3 pr-4 font-medium">Type</th>
              <th className="pb-3 pr-4 font-medium">Plan</th>
              <th className="pb-3 pr-4 font-medium">Joined</th>
              <th className="pb-3 pr-4 font-medium">Payments</th>
              <th className="pb-3 font-medium">Commission</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="py-3 pr-4">
                  <p className="font-medium">{row.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{row.email}</p>
                </td>
                <td className="py-3 pr-4">{row.accountType}</td>
                <td className="py-3 pr-4 capitalize">{formatTier(row.tier)}</td>
                <td className="py-3 pr-4 text-muted-foreground">
                  {formatRelativeDate(new Date(row.joinedAt))}
                </td>
                <td className="py-3 pr-4">{row.planPayments}</td>
                <td className="py-3 font-medium">
                  {formatPrice(row.commissionEarned, { currency })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
