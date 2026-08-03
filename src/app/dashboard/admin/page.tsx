import { AdminStatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="text-muted-foreground">
          Platform overview for NyumbaHub Kenya operations.
        </p>
      </div>

      <AdminStatsCards />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending moderation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { item: "New listing: 4-Bed Karen House", type: "Property" },
              { item: "Agent verification: Faith Mwangi", type: "Agent" },
              { item: "User report: Duplicate listing in Ruiru", type: "Report" },
            ].map((item) => (
              <div key={item.item} className="flex items-center justify-between border-b pb-3 last:border-0">
                <span className="text-sm">{item.item}</span>
                <Badge variant="outline">{item.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { ref: "NH-2847193", amount: "KES 2,500", method: "M-Pesa" },
              { ref: "NH-2847188", amount: "KES 4,999", method: "Card" },
              { ref: "NH-2847175", amount: "KES 5,000", method: "M-Pesa" },
            ].map((p) => (
              <div key={p.ref} className="flex items-center justify-between border-b pb-3 last:border-0 text-sm">
                <span className="font-mono text-muted-foreground">{p.ref}</span>
                <span>{p.amount}</span>
                <Badge variant="secondary">{p.method}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
