"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Building2, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice, formatRelativeDate } from "@/lib/utils";

type Summary = {
  totalPartners: number;
  activePartners: number;
  suspendedPartners: number;
  totalHotelsReferred: number;
  pendingWithdrawalCount: number;
  pendingWithdrawalAmount: number;
  totalCommissionsEarned: number;
  currency: string;
};

type PartnerRow = {
  userId: string;
  name: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
  referralCode: string;
  hotelsReferred: number;
  joinedAt: string;
  availableBalance: number;
  pendingBalance: number;
  lifetimeEarned: number;
  lifetimePaidOut: number;
  currency: string;
  pendingWithdrawals: number;
  commissionTotal: number;
  payoutLabel: string;
};

type ReferredHotelRow = {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  tier: string | null;
  joinedAt: string;
  partnerUserId: string;
  partnerName: string | null;
  partnerEmail: string;
  partnerReferralCode: string;
  planPayments: number;
  commissionEarned: number;
};

type WithdrawalRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  payoutLabel: string;
};

type CommissionRow = {
  id: string;
  amount: number;
  grossAmount: number;
  currency: string;
  status: string;
  description: string;
  createdAt: string;
  partnerUserId: string;
  partnerName: string | null;
  partnerEmail: string;
};

type PartnerDetail = {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
    isActive: boolean;
    joinedAt: string;
    nationalId: string | null;
    payoutLabel: string;
  };
  profile: {
    referralCode: string;
    hotelsReferred: number;
    referralUrl: string;
  };
  summary: {
    availableBalance: number;
    lifetimeEarned: number;
    monthEarned: number;
    currency: string;
  };
  referredHotels: Array<{
    id: string;
    name: string | null;
    email: string;
    tier: string | null;
    joinedAt: string;
    planPayments: number;
    commissionEarned: number;
  }>;
  recentCommissions: CommissionRow[];
  withdrawals: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
};

function withdrawalStatus(status: string) {
  if (status === "PENDING") return "Requested";
  if (status === "PAID_OUT") return "Paid";
  if (status === "CANCELLED") return "Rejected";
  return status;
}

export function AdminJobPartnersDashboard() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [referredHotels, setReferredHotels] = useState<ReferredHotelRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PartnerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/job-partners");
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load job partners");
        return;
      }
      setSummary(json.data.summary);
      setPartners(json.data.partners ?? []);
      setReferredHotels(json.data.referredHotels ?? []);
      setWithdrawals(json.data.withdrawals ?? []);
      setCommissions(json.data.commissions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openDetail(userId: string) {
    setDetailId(userId);
    setDetailLoading(true);
    setPayoutAmount("");
    setPayoutNote("");
    try {
      const res = await fetch(`/api/admin/job-partners/${userId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not load partner");
        setDetailId(null);
        return;
      }
      setDetail(json.data);
    } finally {
      setDetailLoading(false);
    }
  }

  async function toggleActive(userId: string, isActive: boolean) {
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/job-partners/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      toast.success(isActive ? "Partner reactivated" : "Partner suspended");
      await load();
      if (detailId === userId && json.data) {
        setDetail(json.data);
      }
    } finally {
      setBusyId(null);
    }
  }

  async function toggleHotelActive(hotelUserId: string, isActive: boolean) {
    setBusyId(hotelUserId);
    try {
      const res = await fetch(`/api/admin/users/${hotelUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Update failed");
        return;
      }
      toast.success(isActive ? "Hotel account reactivated" : "Hotel account suspended");
      await load();
      if (detailId) await openDetail(detailId);
    } finally {
      setBusyId(null);
    }
  }

  async function reviewWithdrawal(
    withdrawalId: string,
    action: "approve" | "reject",
  ) {
    setReviewBusy(withdrawalId);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ withdrawalId, action }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Could not review withdrawal");
        return;
      }
      toast.success(action === "approve" ? "Withdrawal marked paid" : "Withdrawal rejected");
      await load();
      if (detailId) await openDetail(detailId);
    } finally {
      setReviewBusy(null);
    }
  }

  async function recordPayout(userId: string) {
    const amount = Number(payoutAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a payout amount");
      return;
    }
    setBusyId(userId);
    try {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount,
          note: payoutNote || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error ?? "Payout failed");
        return;
      }
      toast.success("Payout recorded");
      setPayoutAmount("");
      setPayoutNote("");
      await load();
      await openDetail(userId);
    } finally {
      setBusyId(null);
    }
  }

  const q = query.trim().toLowerCase();
  const filteredPartners = partners.filter((p) => {
    if (!q) return true;
    return (
      p.email.toLowerCase().includes(q) ||
      (p.name?.toLowerCase().includes(q) ?? false) ||
      p.referralCode.toLowerCase().includes(q)
    );
  });

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "PENDING");

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading job partners…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job partners</h1>
          <p className="mt-1 text-muted-foreground">
            Track recruitment partners, hotels they onboard, commissions, payout
            requests, and account status.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Partners</p>
              <p className="mt-1 text-2xl font-bold">{summary.totalPartners}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {summary.activePartners} active · {summary.suspendedPartners}{" "}
                suspended
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Hotels referred</p>
              <p className="mt-1 text-2xl font-bold">
                {summary.totalHotelsReferred}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Commissions earned</p>
              <p className="mt-1 text-2xl font-bold">
                {formatPrice(summary.totalCommissionsEarned, {
                  currency: summary.currency,
                })}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Pending payouts</p>
              <p className="mt-1 text-2xl font-bold">
                {summary.pendingWithdrawalCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatPrice(summary.pendingWithdrawalAmount, {
                  currency: summary.currency,
                })}{" "}
                requested
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Tabs defaultValue="partners">
        <TabsList className="flex h-auto flex-wrap gap-1">
          <TabsTrigger value="partners" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Partners
            <Badge variant="secondary">{partners.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <Wallet className="h-4 w-4" />
            Payout requests
            {pendingWithdrawals.length > 0 ? (
              <Badge>{pendingWithdrawals.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="hotels" className="gap-2">
            <Building2 className="h-4 w-4" />
            Referred hotels
            <Badge variant="secondary">{referredHotels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
        </TabsList>

        <TabsContent value="partners" className="mt-4 space-y-4">
          <Input
            placeholder="Search name, email, or referral code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-md"
          />
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="p-3 font-medium">Partner</th>
                    <th className="p-3 font-medium">Referral</th>
                    <th className="p-3 font-medium">Hotels</th>
                    <th className="p-3 font-medium">Balance</th>
                    <th className="p-3 font-medium">Earned</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-muted-foreground">
                        No job partners yet.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((p) => (
                      <tr key={p.userId} className="border-b last:border-0">
                        <td className="p-3">
                          <p className="font-medium">{p.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">{p.email}</p>
                        </td>
                        <td className="p-3 font-mono text-xs">{p.referralCode}</td>
                        <td className="p-3">{p.hotelsReferred}</td>
                        <td className="p-3">
                          {formatPrice(p.availableBalance, {
                            currency: p.currency,
                          })}
                          {p.pendingWithdrawals > 0 ? (
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              {p.pendingWithdrawals} payout req
                            </Badge>
                          ) : null}
                        </td>
                        <td className="p-3">
                          {formatPrice(p.commissionTotal, {
                            currency: p.currency,
                          })}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={p.isActive}
                              disabled={busyId === p.userId}
                              onCheckedChange={(checked) =>
                                void toggleActive(p.userId, checked)
                              }
                            />
                            <span className="text-xs">
                              {p.isActive ? "Active" : "Suspended"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void openDetail(p.userId)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Partner withdrawal requests</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {withdrawals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No payout requests yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">When</th>
                      <th className="pb-3 pr-4 font-medium">Partner</th>
                      <th className="pb-3 pr-4 font-medium">Amount</th>
                      <th className="pb-3 pr-4 font-medium">Send to</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatRelativeDate(new Date(row.createdAt))}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{row.userName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.userEmail}
                          </p>
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          {formatPrice(row.amount, { currency: row.currency })}
                        </td>
                        <td className="py-3 pr-4 text-xs">{row.payoutLabel}</td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              row.status === "PENDING"
                                ? "secondary"
                                : row.status === "PAID_OUT"
                                  ? "default"
                                  : "destructive"
                            }
                          >
                            {withdrawalStatus(row.status)}
                          </Badge>
                        </td>
                        <td className="py-3">
                          {row.status === "PENDING" ? (
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                disabled={reviewBusy === row.id}
                                onClick={() =>
                                  void reviewWithdrawal(row.id, "approve")
                                }
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={reviewBusy === row.id}
                                onClick={() =>
                                  void reviewWithdrawal(row.id, "reject")
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => void openDetail(row.userId)}
                              >
                                View partner
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => void openDetail(row.userId)}
                            >
                              View partner
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hotels" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All hotels brought onboard</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {referredHotels.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No referred hotels yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Hotel / operator</th>
                      <th className="pb-3 pr-4 font-medium">Referred by</th>
                      <th className="pb-3 pr-4 font-medium">Plan</th>
                      <th className="pb-3 pr-4 font-medium">Payments</th>
                      <th className="pb-3 pr-4 font-medium">Commission</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referredHotels.map((hotel) => (
                      <tr key={hotel.id} className="border-b last:border-0">
                        <td className="py-3 pr-4">
                          <p className="font-medium">{hotel.name ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {hotel.email}
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <p>{hotel.partnerName ?? "—"}</p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {hotel.partnerReferralCode}
                          </p>
                        </td>
                        <td className="py-3 pr-4 capitalize">
                          {hotel.tier?.replace(/_/g, " ") ?? "Not subscribed"}
                        </td>
                        <td className="py-3 pr-4">{hotel.planPayments}</td>
                        <td className="py-3 pr-4">
                          {formatPrice(hotel.commissionEarned, {
                            currency: "KES",
                          })}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={hotel.isActive}
                              disabled={busyId === hotel.id}
                              onCheckedChange={(checked) =>
                                void toggleHotelActive(hotel.id, checked)
                              }
                            />
                            <span className="text-xs">
                              {hotel.isActive ? "Active" : "Suspended"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent hotel recruitment commissions</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {commissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No commissions recorded yet.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">When</th>
                      <th className="pb-3 pr-4 font-medium">Partner</th>
                      <th className="pb-3 pr-4 font-medium">Details</th>
                      <th className="pb-3 pr-4 font-medium">Plan payment</th>
                      <th className="pb-3 pr-4 font-medium">Commission</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((row) => (
                      <tr key={row.id} className="border-b last:border-0">
                        <td className="py-3 pr-4 text-muted-foreground">
                          {formatRelativeDate(new Date(row.createdAt))}
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{row.partnerName ?? "—"}</p>
                          <p className="text-xs text-muted-foreground">
                            {row.partnerEmail}
                          </p>
                        </td>
                        <td className="py-3 pr-4">{row.description}</td>
                        <td className="py-3 pr-4">
                          {formatPrice(row.grossAmount, {
                            currency: row.currency,
                          })}
                        </td>
                        <td className="py-3 pr-4 font-medium text-primary">
                          +{formatPrice(row.amount, { currency: row.currency })}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary">{row.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={Boolean(detailId)} onOpenChange={(open) => !open && setDetailId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detail?.user.name ?? "Job partner"}</SheetTitle>
            <SheetDescription>
              Manage wallet, referred hotels, and account status.
            </SheetDescription>
          </SheetHeader>
          {detailLoading ? (
            <div className="flex items-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : detail ? (
            <div className="mt-6 space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">{detail.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    {detail.user.phone ?? "No phone"}
                  </p>
                  <p className="mt-1 font-mono text-xs">
                    {detail.profile.referralCode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={detail.user.isActive}
                    disabled={busyId === detail.user.id}
                    onCheckedChange={(checked) =>
                      void toggleActive(detail.user.id, checked)
                    }
                  />
                  <span className="text-sm">
                    {detail.user.isActive ? "Active" : "Suspended"}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-lg font-bold">
                    {formatPrice(detail.summary.availableBalance, {
                      currency: detail.summary.currency,
                    })}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Lifetime earned</p>
                  <p className="text-lg font-bold">
                    {formatPrice(detail.summary.lifetimeEarned, {
                      currency: detail.summary.currency,
                    })}
                  </p>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border p-4">
                <p className="text-sm font-medium">Payout method</p>
                <p className="text-sm text-muted-foreground">
                  {detail.user.payoutLabel}
                </p>
                <div className="grid gap-2 pt-2 sm:grid-cols-2">
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
                </div>
                <Button
                  size="sm"
                  disabled={busyId === detail.user.id || !payoutAmount}
                  onClick={() => void recordPayout(detail.user.id)}
                >
                  Record manual payout
                </Button>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">
                  Referred hotels ({detail.referredHotels.length})
                </p>
                {detail.referredHotels.length === 0 ? (
                  <p className="text-sm text-muted-foreground">None yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {detail.referredHotels.map((hotel) => (
                      <li
                        key={hotel.id}
                        className="flex items-start justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="font-medium">{hotel.name ?? hotel.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {hotel.planPayments} plan payments ·{" "}
                            {formatPrice(hotel.commissionEarned, {
                              currency: detail.summary.currency,
                            })}{" "}
                            commission
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {hotel.tier?.replace(/_/g, " ") ?? "No plan"}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Referral link:{" "}
                <Link
                  href={detail.profile.referralUrl}
                  className="text-primary hover:underline"
                  target="_blank"
                >
                  Open registration link
                </Link>
              </p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
