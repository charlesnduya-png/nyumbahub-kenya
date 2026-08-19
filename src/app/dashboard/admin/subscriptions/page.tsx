import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { prisma } from "@/lib/prisma";

export default async function AdminSubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true } },
    },
  });

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
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{s.user.name ?? "—"}</td>
                  <td className="py-3 pr-4"><Badge variant="outline">{s.plan}</Badge></td>
                  <td className="py-3 pr-4">
                    {`KES ${s.amount.toLocaleString("en-KE")}`}
                  </td>
                  <td className="py-3 pr-4">
                    <Badge variant={s.status === "ACTIVE" ? "default" : "secondary"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {s.endDate
                      ? s.endDate.toLocaleDateString("en-KE")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
