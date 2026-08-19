"use client";

import { useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TEAM_ROLES = [
  "FULL",
  "LISTINGS",
  "INQUIRIES",
  "VIEWINGS",
  "OFFERS",
  "BOOKINGS",
  "MESSAGES",
  "READ",
] as const;

type TeamRole = (typeof TEAM_ROLES)[number];

const ROLE_LABEL: Record<TeamRole, string> = {
  FULL: "Full access",
  LISTINGS: "Manage listings",
  INQUIRIES: "Manage inquiries",
  VIEWINGS: "Manage viewings",
  OFFERS: "Manage offers",
  BOOKINGS: "Manage bookings",
  MESSAGES: "Manage messages",
  READ: "Read-only",
};

type TeamMember = {
  userId: string;
  role: TeamRole;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

export function TeamManager() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("INQUIRIES");

  async function load() {
    try {
      const res = await fetch("/api/team/members");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load team");
      }
      setMembers(json.data?.members ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load team");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    await load();
  }

  async function addMember() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to add team member");
        return;
      }
      setEmail("");
      setRole("INQUIRIES");
      await refresh();
      toast.success("Team member added");
    } catch {
      toast.error("Unable to add team member");
    } finally {
      setBusy(false);
    }
  }

  async function updateRole(userId: string, nextRole: TeamRole) {
    setBusy(true);
    try {
      const res = await fetch(`/api/team/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to update role");
        return;
      }
      await refresh();
      toast.success("Role updated");
    } catch {
      toast.error("Unable to update role");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(userId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/team/members/${userId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to remove member");
        return;
      }
      await refresh();
      toast.success("Member removed");
    } catch {
      toast.error("Unable to remove member");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add your team accounts and assign what they can manage. Team members
          operate under your profile.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="team-email">Member email</Label>
            <Input
              id="team-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              disabled={busy}
            />
          </div>

          <div className="space-y-2">
            <Label>Team role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)} disabled={busy}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void addMember()} disabled={busy}>
            Add member
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={loading || busy}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading team…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet.</p>
        ) : (
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.userId}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-[180px]">
                  <p className="text-sm font-medium">
                    {m.user.name ?? m.user.email}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.user.email}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-[220px]">
                    <Select
                      value={m.role}
                      onValueChange={(v) =>
                        void updateRole(m.userId, v as TeamRole)
                      }
                      disabled={busy}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABEL[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="destructive"
                    size="icon"
                    type="button"
                    aria-label="Remove team member"
                    disabled={busy}
                    onClick={() => void removeMember(m.userId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

