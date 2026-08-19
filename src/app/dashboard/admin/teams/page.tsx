"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ACCOUNT_TYPE_LABELS } from "@/lib/admin-growth";
import { TEAM_ROLE_LABEL, type TeamRoleValue } from "@/lib/team-roles";
import type { Role } from "@/types";

type TeamMemberRow = {
  userId: string;
  name: string;
  email: string;
  isActive: boolean;
  roles: TeamRoleValue[];
};

type TeamInviteRow = {
  email: string;
  roles: TeamRoleValue[];
  expiresAt: string;
};

type AdminTeam = {
  ownerId: string;
  adminName: string;
  adminEmail: string;
  adminRole: Role;
  adminActive: boolean;
  members: TeamMemberRow[];
  pendingInvites: TeamInviteRow[];
};

function rolesText(roles?: TeamRoleValue[] | null) {
  const labels = (roles ?? []).map((role) => TEAM_ROLE_LABEL[role] ?? role);
  return labels.length > 0 ? labels : ["No role"];
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<AdminTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/teams");
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load teams");
        setTeams([]);
        return;
      }
      setTeams(json.data ?? []);
    } catch {
      toast.error("Could not load teams");
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((team) => {
      if (
        team.adminName.toLowerCase().includes(q) ||
        team.adminEmail.toLowerCase().includes(q)
      ) {
        return true;
      }
      return (
        team.members.some(
          (member) =>
            member.name.toLowerCase().includes(q) ||
            member.email.toLowerCase().includes(q) ||
            rolesText(member.roles).some((role) =>
              role.toLowerCase().includes(q),
            ),
        ) ||
        team.pendingInvites.some((invite) =>
          invite.email.toLowerCase().includes(q),
        )
      );
    });
  }, [teams, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Teams</h1>
          <p className="text-muted-foreground">
            Each professional account admin, the people on that team, their
            emails, and the roles they were given.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/admin/users">Accounts</Link>
          </Button>
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="gap-4 space-y-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              {teams.length} {teams.length === 1 ? "account team" : "account teams"}
            </CardTitle>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search admin, email, or role…"
                className="w-full pl-8 sm:w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading teams…
            </div>
          ) : visible.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground">
              {teams.length === 0
                ? "No teams yet. They appear here after a landlord or agent invites someone from The team."
                : "No teams match that search."}
            </p>
          ) : (
            <div className="space-y-6">
              {visible.map((team) => (
                <div key={team.ownerId} className="overflow-x-auto rounded-lg border">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">
                        Account admin: {team.adminName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {team.adminEmail}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">
                        {ACCOUNT_TYPE_LABELS[team.adminRole]?.label ??
                          team.adminRole}
                      </Badge>
                      <Badge variant={team.adminActive ? "default" : "destructive"}>
                        {team.adminActive ? "Active" : "Suspended"}
                      </Badge>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="px-4 py-2 font-medium">Member email</th>
                        <th className="px-4 py-2 font-medium">Name</th>
                        <th className="px-4 py-2 font-medium">Roles</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {team.members.length === 0 &&
                      team.pendingInvites.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-4 text-muted-foreground"
                          >
                            No team members yet.
                          </td>
                        </tr>
                      ) : null}
                      {team.members.map((member) => (
                        <tr key={member.userId} className="border-b last:border-0">
                          <td className="px-4 py-3 font-medium">{member.email}</td>
                          <td className="px-4 py-3">{member.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {rolesText(member.roles).map((role) => (
                                <Badge key={role} variant="outline">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={member.isActive ? "default" : "destructive"}>
                              {member.isActive ? "Member" : "Suspended"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {team.pendingInvites.map((invite) => (
                        <tr
                          key={`${invite.email}-${invite.expiresAt}`}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-3 font-medium">{invite.email}</td>
                          <td className="px-4 py-3 text-muted-foreground">—</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {rolesText(invite.roles).map((role) => (
                                <Badge key={role} variant="outline">
                                  {role}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">Invited</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
