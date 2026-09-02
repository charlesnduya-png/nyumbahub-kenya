import { formatPrice, formatRelativeDate } from "@/lib/utils";

type CommissionRow = {
  id: string;
  amount: number;
  grossAmount: number;
  currency: string;
  description: string;
  createdAt: string;
};

export function JobPartnerCommissionsList({ rows }: { rows: CommissionRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Commissions appear here when a referred agency or hotel operator completes
        a monthly plan payment.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl border bg-card p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium text-primary">
                +{formatPrice(row.amount, { currency: row.currency })}
              </p>
              <p className="shrink-0 text-xs text-muted-foreground">
                {formatRelativeDate(new Date(row.createdAt))}
              </p>
            </div>
            <p className="mt-2 text-muted-foreground">{row.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Plan payment:{" "}
              {formatPrice(row.grossAmount, { currency: row.currency })}
            </p>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-3 pr-4 font-medium">When</th>
              <th className="pb-3 pr-4 font-medium">Details</th>
              <th className="pb-3 pr-4 font-medium">Plan payment</th>
              <th className="pb-3 font-medium">You earned</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
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
      </div>
    </>
  );
}
