"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Search, Building2, Users } from "lucide-react";
import { toast } from "sonner";

import { UserListingsDialog } from "@/components/admin/user-listings-dialog";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ACCOUNT_TYPE_LABELS } from "@/lib/admin-growth";
import { TEAM_ROLE_LABEL, type TeamRoleValue } from "@/lib/team-roles";
import type { Role } from "@/types";

type AdminTeamMember = {
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  role: Role;
  roles: TeamRoleValue[];
};

type AdminTeamInvite = {
  email: string;
  roles: TeamRoleValue[];
  expiresAt: string;
};

export type AdminUserTeam =
  | {
      kind: "owner";
      memberCount: number;
      members: AdminTeamMember[];
      pendingInvites: AdminTeamInvite[];
    }
  | {
      kind: "member";
      ownerId: string;
      ownerName: string;
      ownerEmail: string;
      roles: TeamRoleValue[];
    };

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  image?: string | null;
  hasAgentProfile?: boolean;
  nationalId?: string | null;
  nationalIdVerified?: string;
  verificationStatus?: string;
  agencyName?: string | null;
  licenseNumber?: string | null;
  agentCounty?: string | null;
  agentVerificationStatus?: string | null;
  agentId?: string | null;
  isVerified?: boolean;
  ownedListingCount?: number;
  agentListingCount?: number;
  listingCount?: number;
  team?: AdminUserTeam | null;
}

function rolesText(roles?: TeamRoleValue[] | null) {
  return (roles ?? [])
    .map((role) => TEAM_ROLE_LABEL[role] ?? role)
    .join(", ");
}

function AccountTeamCell({ team }: { team?: AdminUserTeam | null }) {
  if (!team) {
    return <span className="text-muted-foreground">No team</span>;
  }

  if (team.kind === "member") {
    return (
      <div className="max-w-[16rem] space-y-1">
        <Badge variant="secondary">On a team</Badge>
        <p className="text-sm font-medium">
          {team.ownerName}
          <span className="font-normal text-muted-foreground">’s account</span>
        </p>
        <p className="text-xs text-muted-foreground">{team.ownerEmail}</p>
        <p className="text-xs text-muted-foreground">{rolesText(team.roles)}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[18rem] space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="default">
          <Users className="mr-1 h-3 w-3" />
          Owner
        </Badge>
        <Badge variant="secondary">
          {team.memberCount} {team.memberCount === 1 ? "member" : "members"}
        </Badge>
        {team.pendingInvites.length > 0 ? (
          <Badge variant="outline">
            {team.pendingInvites.length} pending
          </Badge>
        ) : null}
      </div>
      {team.members.length === 0 && team.pendingInvites.length === 0 ? (
        <p className="text-xs text-muted-foreground">No one invited yet</p>
      ) : (
        <ul className="space-y-1.5">
          {team.members.map((member) => (
            <li key={member.userId} className="text-xs">
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-muted-foreground">{member.email}</p>
              <p className="text-muted-foreground">{rolesText(member.roles)}</p>
            </li>
          ))}
          {team.pendingInvites.map((invite) => (
            <li key={`${invite.email}-${invite.expiresAt}`} className="text-xs text-muted-foreground">
              <p>{invite.email} · invited</p>
              <p>{rolesText(invite.roles)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type AccountTab = "tenants" | "agents" | "landlords" | "admins" | "all";

const TAB_CONFIG: Array<{
  id: AccountTab;
  role: Role | "ALL";
  label: string;
}> = [
  { id: "tenants", role: "BUYER", label: "Tenants" },
  { id: "agents", role: "AGENT", label: "Agents" },
  { id: "landlords", role: "SELLER", label: "Landlords & owners" },
  { id: "admins", role: "ADMIN", label: "Admins" },
  { id: "all", role: "ALL", label: "All accounts" },
];

function roleForTab(tab: AccountTab): Role | "ALL" {
  return TAB_CONFIG.find((t) => t.id === tab)?.role ?? "ALL";
}

function UsersTable({
  users,
  busyId,
  onUpdate,
  onVerify,
  showListings,
  showVerify,
  onViewListings,
}: {
  users: AdminUser[];
  busyId: string | null;
  onUpdate: (id: string, patch: { isActive?: boolean; role?: Role }) => void;
  onVerify?: (user: AdminUser, verified: boolean) => void;
  showListings?: boolean;
  showVerify?: boolean;
  onViewListings?: (user: AdminUser) => void;
}) {
  if (users.length === 0) {
    return (
      <p className="py-8 text-sm text-muted-foreground">No accounts in this group.</p>
    );
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="pb-3 pr-4 font-medium">Name</th>
          <th className="pb-3 pr-4 font-medium">Team</th>
          <th className="pb-3 pr-4 font-medium">Email</th>
          <th className="pb-3 pr-4 font-medium">Phone</th>
          {showListings ? (
            <th className="pb-3 pr-4 font-medium">ID / License</th>
          ) : null}
          <th className="pb-3 pr-4 font-medium">Role</th>
          <th className="pb-3 pr-4 font-medium">Joined</th>
          {showListings ? (
            <th className="pb-3 pr-4 font-medium">Listings</th>
          ) : null}
          {showVerify ? (
            <th className="pb-3 pr-4 font-medium">Verified</th>
          ) : null}
          <th className="pb-3 font-medium">Active</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id} className="border-b last:border-0">
            <td className="py-3 pr-4 font-medium">
              <div className="flex items-center gap-2">
                {u.name}
                {u.hasAgentProfile ? (
                  <Badge variant="outline" className="text-[10px]">
                    Agent profile
                  </Badge>
                ) : null}
              </div>
            </td>
            <td className="py-3 pr-4 align-top">
              <AccountTeamCell team={u.team} />
            </td>
            <td className="py-3 pr-4">{u.email}</td>
            <td className="py-3 pr-4">{u.phone}</td>
            {showListings ? (
              <td className="py-3 pr-4">
                <p className="font-mono text-xs">
                  ID: {u.nationalId ?? "—"}
                </p>
                {u.licenseNumber ? (
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    License: {u.licenseNumber}
                  </p>
                ) : null}
                {u.agencyName ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {u.agencyName}
                  </p>
                ) : null}
                <Badge variant="outline" className="mt-1 text-[10px]">
                  {u.nationalIdVerified ?? u.verificationStatus ?? "UNVERIFIED"}
                </Badge>
              </td>
            ) : null}
            <td className="py-3 pr-4">
              <Select
                value={u.role}
                disabled={busyId === u.id}
                onValueChange={(role) =>
                  void onUpdate(u.id, { role: role as Role })
                }
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["BUYER", "SELLER", "AGENT", "ADMIN"] as Role[]).map(
                    (r) => (
                      <SelectItem key={r} value={r}>
                        {ACCOUNT_TYPE_LABELS[r].label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </td>
            <td className="py-3 pr-4 text-muted-foreground">
              {new Date(u.createdAt).toLocaleDateString("en-KE", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </td>
            {showListings ? (
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {u.listingCount ?? u.ownedListingCount ?? 0}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() => onViewListings?.(u)}
                  >
                    <Building2 className="mr-1 h-3.5 w-3.5" />
                    View
                  </Button>
                </div>
              </td>
            ) : null}
            {showVerify ? (
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={Boolean(u.isVerified)}
                    disabled={busyId === u.id}
                    onCheckedChange={(checked) => onVerify?.(u, checked)}
                    aria-label={`Verify ${u.name}`}
                  />
                  <Badge variant={u.isVerified ? "default" : "outline"}>
                    {u.isVerified ? "Verified" : "Pending"}
                  </Badge>
                </div>
              </td>
            ) : null}
            <td className="py-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={u.isActive}
                  disabled={busyId === u.id}
                  onCheckedChange={(checked) =>
                    void onUpdate(u.id, { isActive: checked })
                  }
                  aria-label={`Toggle active for ${u.name}`}
                />
                <Badge variant={u.isActive ? "default" : "destructive"}>
                  {u.isActive ? "Active" : "Suspended"}
                </Badge>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function AdminUsersPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as AccountTab) || "tenants";
  const [activeTab, setActiveTab] = useState<AccountTab>(
    TAB_CONFIG.some((t) => t.id === initialTab) ? initialTab : "tenants",
  );

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [listingsUser, setListingsUser] = useState<AdminUser | null>(null);
  const [listingsOpen, setListingsOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load users");
        setUsers([]);
        return;
      }
      setUsers(json.data ?? []);
    } catch {
      toast.error("Could not load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const tab = searchParams.get("tab") as AccountTab;
    if (tab && TAB_CONFIG.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const counts = useMemo(() => {
    const base = { BUYER: 0, SELLER: 0, AGENT: 0, ADMIN: 0, total: users.length };
    for (const u of users) {
      base[u.role] += 1;
    }
    return base;
  }, [users]);

  const filterUsers = useCallback(
    (tab: AccountTab) => {
      const role = roleForTab(tab);
      const q = query.trim().toLowerCase();
      return users.filter((u) => {
        if (role !== "ALL" && u.role !== role) return false;
        if (!q) return true;
        const teamHit =
          u.team?.kind === "owner"
            ? u.team.members.some(
                (m) =>
                  m.name.toLowerCase().includes(q) ||
                  m.email.toLowerCase().includes(q),
              ) ||
              u.team.pendingInvites.some((invite) =>
                invite.email.toLowerCase().includes(q),
              )
            : u.team?.kind === "member"
              ? u.team.ownerName.toLowerCase().includes(q) ||
                u.team.ownerEmail.toLowerCase().includes(q)
              : false;
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.toLowerCase().includes(q) ||
          teamHit
        );
      });
    },
    [users, query],
  );

  async function verifyUser(user: AdminUser, verified: boolean) {
    setBusyId(user.id);
    const previous = users;
    setUsers((list) =>
      list.map((u) => (u.id === user.id ? { ...u, isVerified: verified } : u)),
    );

    try {
      const endpoint =
        user.role === "AGENT" && user.agentId
          ? `/api/admin/agents/${user.agentId}`
          : user.role === "AGENT"
            ? `/api/admin/agents/${user.id}`
            : `/api/admin/users/${user.id}`;

      const body =
        user.role === "AGENT"
          ? { isVerified: verified }
          : { isVerified: verified };

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setUsers(previous);
        toast.error(json.error ?? "Verification update failed");
        return;
      }
      toast.success(
        verified
          ? `${user.name} is now verified`
          : `Verification removed for ${user.name}`,
      );
      void load();
    } catch {
      setUsers(previous);
      toast.error("Verification update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function updateUser(
    id: string,
    patch: { isActive?: boolean; role?: Role },
  ) {
    setBusyId(id);
    const previous = users;
    setUsers((list) =>
      list.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    );

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = await res.json();
      if (!res.ok) {
        setUsers(previous);
        toast.error(json.error ?? "Update failed");
        return;
      }
      if (typeof patch.isActive === "boolean") {
        toast.success(patch.isActive ? "Account activated" : "Account suspended");
      }
      if (patch.role) {
        toast.success(`Role updated to ${ACCOUNT_TYPE_LABELS[patch.role].label}`);
      }
    } catch {
      setUsers(previous);
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage tenants, agents, landlords, and admins. Team members are listed
            under Teams.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin">Back to overview</Link>
          </Button>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {(["BUYER", "AGENT", "SELLER", "ADMIN"] as Role[]).map((role) => (
          <Card key={role}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {ACCOUNT_TYPE_LABELS[role].label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {counts[role].toLocaleString("en-KE")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Browse by account type</CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, phone, or team…"
                className="w-full pl-8 sm:w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as AccountTab)}
          >
            <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
              {TAB_CONFIG.map((tab) => {
                const count =
                  tab.role === "ALL"
                    ? counts.total
                    : counts[tab.role as Role];
                return (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    {tab.label}
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {loading ? (
              <div className="flex items-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading accounts…
              </div>
            ) : (
              TAB_CONFIG.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <p className="mb-4 text-sm text-muted-foreground">
                    {tab.role === "ALL"
                      ? "Every account on the platform."
                      : ACCOUNT_TYPE_LABELS[tab.role as Role].description}
                  </p>
                  <div className="overflow-x-auto">
                    <UsersTable
                      users={filterUsers(tab.id)}
                      busyId={busyId}
                      onUpdate={updateUser}
                      onVerify={verifyUser}
                      showListings={
                        tab.id === "agents" || tab.id === "landlords"
                      }
                      showVerify={
                        tab.id === "agents" || tab.id === "landlords"
                      }
                      onViewListings={(user) => {
                        setListingsUser(user);
                        setListingsOpen(true);
                      }}
                    />
                  </div>
                </TabsContent>
              ))
            )}
          </Tabs>
        </CardContent>
      </Card>

      <UserListingsDialog
        user={listingsUser}
        open={listingsOpen}
        onOpenChange={setListingsOpen}
      />
    </div>
  );
}
