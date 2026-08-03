import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const subscriptions = [
  { user: "Grace Wanjiku", plan: "AGENT_PRO", status: "ACTIVE", amount: "KES 4,999", renews: "2026-03-15" },
  { user: "James Otieno", plan: "AGENT_PRO", status: "ACTIVE", amount: "KES 4,999", renews: "2026-03-22" },
  { user: "Mary Wanjiru", plan: "PREMIUM", status: "ACTIVE", amount: "KES 2,499", renews: "2026-04-01" },
  { user: "David Kimani", plan: "BASIC", status: "EXPIRED", amount: "KES 999", renews: "—" },
];

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground">Agent and seller subscription plans.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Active subscriptions</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Plan</th>
                <th className="pb-3 pr-4 font-medium">Amount</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Renews</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.user} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{s.user}</td>
                  <td className="py-3 pr-4"><Badge variant="outline">{s.plan}</Badge></td>
                  <td className="py-3 pr-4">{s.amount}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>{s.status}</Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">{s.renews}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
