"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

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
import type { Role } from "@/types";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  image?: string | null;
  hasAgentProfile?: boolean;
}

const ROLE_FILTERS = ["ALL", "BUYER", "SELLER", "AGENT", "ADMIN"] as const;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [source, setSource] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] =
    useState<(typeof ROLE_FILTERS)[number]>("ALL");

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
      setSource(json.source ?? "");
    } catch {
      toast.error("Could not load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

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
        toast.success(`Role updated to ${patch.role}`);
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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            View and manage every buyer, seller, agent, and admin account.
          </p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {source === "demo" && (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Demo mode: showing seeded demo accounts (+ anyone who registers while
          Postgres is offline). Changes stay in memory until the server restarts.
        </p>
      )}

      <Card>
        <CardHeader className="gap-4 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>All accounts ({filtered.length})</CardTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, phone…"
                className="w-full pl-8 sm:w-64"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) =>
                setRoleFilter(v as (typeof ROLE_FILTERS)[number])
              }
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_FILTERS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r === "ALL" ? "All roles" : r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading accounts…
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">No accounts found.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Email</th>
                  <th className="pb-3 pr-4 font-medium">Phone</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{u.name}</td>
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4">{u.phone}</td>
                    <td className="py-3 pr-4">
                      <Select
                        value={u.role}
                        disabled={busyId === u.id}
                        onValueChange={(role) =>
                          void updateUser(u.id, { role: role as Role })
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(["BUYER", "SELLER", "AGENT", "ADMIN"] as Role[]).map(
                            (r) => (
                              <SelectItem key={r} value={r}>
                                {r}
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
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={u.isActive}
                          disabled={busyId === u.id}
                          onCheckedChange={(checked) =>
                            void updateUser(u.id, { isActive: checked })
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
