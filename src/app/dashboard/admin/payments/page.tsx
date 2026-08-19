"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

interface PaymentRow {
  id: string;
  reference: string;
  productName: string;
  amount: number;
  status: string;
  method: string;
  userEmail?: string | null;
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/admin/payments");
        const json = await res.json();
        if (json.success) setPayments(json.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Listing fees, boosts, and agent subscriptions.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent transactions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments yet. Completed seller/agent payments will appear here.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Reference</th>
                  <th className="pb-3 pr-4 font-medium">Product</th>
                  <th className="pb-3 pr-4 font-medium">Amount</th>
                  <th className="pb-3 pr-4 font-medium">Method</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 font-medium">User</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs">{p.reference}</td>
                    <td className="py-3 pr-4">{p.productName}</td>
                    <td className="py-3 pr-4">{formatPrice(p.amount)}</td>
                    <td className="py-3 pr-4">{p.method}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          p.status === "COMPLETED" ? "default" : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {p.userEmail ?? "—"}
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
