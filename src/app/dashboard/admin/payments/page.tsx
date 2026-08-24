"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

interface PlatformPayment {
  id: string;
  reference: string;
  productName: string;
  amount: number;
  status: string;
  method: string;
  userEmail?: string | null;
  createdAt: string;
}

interface EarningsRow {
  id: string;
  type: string;
  status: string;
  amount: number;
  feeAmount: number;
  currency: string;
  description: string;
  createdAt: string;
  userName: string | null;
  userEmail: string;
  userRole: string;
}

interface RankingRow {
  userId: string;
  name: string;
  email: string;
  role: string;
  agencyName: string | null;
  verified: boolean;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimePaidOut: number;
  currency: string;
}

function typeLabel(type: string) {
  if (type === "BOOKING") return "BnB";
  if (type === "RENT") return "Rent";
  if (type === "SALE") return "Sale";
  if (type === "PAYOUT") return "Payout";
  return type;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [earnings, setEarnings] = useState<EarningsRow[]>([]);
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutUserId, setPayoutUserId] = useState("");
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [paymentsRes, walletRes] = await Promise.all([
        fetch("/api/admin/payments"),
        fetch("/api/admin/wallet"),
      ]);
      const paymentsJson = await paymentsRes.json();
      const walletJson = await walletRes.json();
      if (paymentsJson.success) setPayments(paymentsJson.data ?? []);
      if (walletJson.success) {
        setEarnings(walletJson.data?.earnings ?? []);
        setRankings(walletJson.data?.rankings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function recordPayout(userId: string, amount: number, note?: string) {
    setPayoutBusy(true);
    setPayoutError(null);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount, note }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setPayoutError(json.error ?? "Payout failed");
        return;
      }
      setPayoutAmount("");
      setPayoutNote("");
      await load();
    } finally {
      setPayoutBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Platform fees, professional earnings, and agent rankings.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()}>
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="rankings">
        <TabsList className="flex h-auto flex-wrap">
          <TabsTrigger value="rankings">Agent rankings</TabsTrigger>
          <TabsTrigger value="earnings">Professional earnings</TabsTrigger>
          <TabsTrigger value="platform">Platform payments</TabsTrigger>
          <TabsTrigger value="payouts">Record payout</TabsTrigger>
        </TabsList>

        <TabsContent value="rankings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Who has made the most</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : rankings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No agents or landlords yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">#</th>
                      <th className="pb-3 pr-4 font-medium">Professional</th>
                      <th className="pb-3 pr-4 font-medium">Role</th>
                      <th className="pb-3 pr-4 font-medium">Made</th>
                      <th className="pb-3 pr-4 font-medium">Pending</th>
                      <th className="pb-3 pr-4 font-medium">Balance</th>
                      <th className="pb-3 font-medium">Paid out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((row, index) => (
                      <tr key={row.userId} className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">{index + 1}</td>
                        <td className="py-3 pr-4">
                          <div className="font-medium">
                            {row.agencyName || row.name}
                            {row.verified ? (
                              <Badge className="ml-2" variant="secondary">
                                Verified
                              </Badge>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.email}
                          </div>
                        </td>
                        <td className="py-3 pr-4">{row.role}</td>
                        <td className="py-3 pr-4 font-medium">
                          {formatPrice(row.lifetimeEarned, {
                            currency: row.currency,
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          {formatPrice(row.pendingBalance, {
                            currency: row.currency,
                          })}
                        </td>
                        <td className="py-3 pr-4">
                          {formatPrice(row.availableBalance, {
                            currency: row.currency,
                          })}
                        </td>
                        <td className="py-3">
                          {formatPrice(row.lifetimePaidOut, {
                            currency: row.currency,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All professional earnings</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : earnings.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No professional earnings yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">When</th>
                      <th className="pb-3 pr-4 font-medium">Professional</th>
                      <th className="pb-3 pr-4 font-medium">Type</th>
                      <th className="pb-3 pr-4 font-medium">Details</th>
                      <th className="pb-3 pr-4 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {earnings.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatRelativeDate(row.createdAt)}
                        </td>
                        <td className="py-3 pr-4">
                          <div>{row.userName ?? row.userEmail}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.userRole}
                          </div>
                        </td>
                        <td className="py-3 pr-4">{typeLabel(row.type)}</td>
                        <td className="py-3 pr-4">{row.description}</td>
                        <td className="py-3 pr-4">
                          {formatPrice(row.amount, { currency: row.currency })}
                        </td>
                        <td className="py-3">
                          <Badge
                            variant={
                              row.status === "AVAILABLE" ? "default" : "secondary"
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Listing fees, boosts, and subscriptions</CardTitle>
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
                        <td className="py-3 pr-4 font-mono text-xs">
                          {p.reference}
                        </td>
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
        </TabsContent>

        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Pay a professional from their available balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={payoutUserId}
                  onChange={(e) => setPayoutUserId(e.target.value)}
                >
                  <option value="">Select professional</option>
                  {rankings
                    .filter((row) => row.availableBalance > 0)
                    .map((row) => (
                      <option key={row.userId} value={row.userId}>
                        {row.agencyName || row.name} ·{" "}
                        {formatPrice(row.availableBalance, {
                          currency: row.currency,
                        })}
                      </option>
                    ))}
                </select>
                <Input
                  type="number"
                  min="1"
                  placeholder="Amount (KES)"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                />
                <Input
                  placeholder="Note (optional)"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                />
                <Button
                  disabled={payoutBusy || !payoutUserId || !payoutAmount}
                  onClick={() =>
                    void recordPayout(
                      payoutUserId,
                      Number(payoutAmount),
                      payoutNote || undefined,
                    )
                  }
                >
                  Record payout
                </Button>
              </div>
              {payoutError ? (
                <p className="text-sm text-destructive">{payoutError}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This reduces their available wallet balance after you send
                  M-Pesa or bank. It does not send money by itself.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
