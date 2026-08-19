"use client";

import { useEffect, useState } from "react";
import { Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { TeamRolePicker } from "@/components/professional/team-role-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TEAM_ROLE_LABEL,
  type TeamRoleValue,
} from "@/lib/account-team";

type TeamMember = {
  userId: string;
  roles: TeamRoleValue[];
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
};

type TeamInvite = {
  id: string;
  email: string;
  roles: TeamRoleValue[];
  expiresAt: string;
  createdAt: string;
};

function rolesText(roles: TeamRoleValue[]) {
  return roles.map((role) => TEAM_ROLE_LABEL[role] ?? role).join(", ");
}

export function TeamManager() {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<TeamRoleValue[]>(["INQUIRIES"]);

  async function load() {
    try {
      const res = await fetch("/api/team/members");
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to load team");
      }
      setMembers(json.data?.members ?? []);
      setInvites(json.data?.invites ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load team");
      setMembers([]);
      setInvites([]);
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

  async function inviteMember() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), roles }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to send invitation");
        return;
      }
      setEmail("");
      setRoles(["INQUIRIES"]);
      await refresh();
      if (json.data?.emailSent) {
        toast.success("Invitation email sent");
      } else if (json.data?.joinUrl) {
        try {
          await navigator.clipboard.writeText(json.data.joinUrl);
          toast.success("Invitation created. Join link copied — send it if the email does not arrive.");
        } catch {
          toast.success("Invitation created. Use Resend if they did not get the email.");
        }
      } else {
        toast.success(json.message ?? "Invitation created");
      }
    } catch {
      toast.error("Unable to send invitation");
    } finally {
      setBusy(false);
    }
  }

  async function updateRoles(userId: string, nextRoles: TeamRoleValue[]) {
    setBusy(true);
    try {
      const res = await fetch(`/api/team/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: nextRoles }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to update roles");
        return;
      }
      setMembers((current) =>
        current.map((member) =>
          member.userId === userId ? { ...member, roles: nextRoles } : member,
        ),
      );
      toast.success("Roles updated");
    } catch {
      toast.error("Unable to update roles");
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

  async function resendInvite(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/team/invites/${id}`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to resend invitation");
        return;
      }
      if (json.data?.joinUrl) {
        try {
          await navigator.clipboard.writeText(json.data.joinUrl);
          toast.success("Email could not be sent. Join link copied.");
        } catch {
          toast.success(json.message ?? "Invitation updated");
        }
      } else {
        toast.success("Invitation email resent");
      }
    } catch {
      toast.error("Unable to resend invitation");
    } finally {
      setBusy(false);
    }
  }

  async function cancelInvite(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/team/invites/${id}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to cancel invitation");
        return;
      }
      setInvites((current) => current.filter((invite) => invite.id !== id));
      toast.success("Invitation cancelled");
    } catch {
      toast.error("Unable to cancel invitation");
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
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Invite people by email and assign one or more roles. They receive a
          link to create an account (or sign in) and join your team.
        </p>

        <div className="space-y-3">
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
            <Label>Roles</Label>
            <TeamRolePicker value={roles} onChange={setRoles} disabled={busy} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void inviteMember()} disabled={busy}>
            Send invitation
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
        ) : (
          <>
            {invites.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Pending invitations</h3>
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="min-w-[180px]">
                      <p className="text-sm font-medium">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {rolesText(invite.roles)} · expires{" "}
                        {new Date(invite.expiresAt).toLocaleDateString("en-KE")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => void resendInvite(invite.id)}
                      >
                        Resend
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => void cancelInvite(invite.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {invites.length === 0
                  ? "No team members yet."
                  : "No accepted members yet."}
              </p>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold">Active members</h3>
                {members.map((m) => (
                  <div key={m.userId} className="space-y-3 rounded-lg border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-[180px]">
                        <p className="text-sm font-medium">
                          {m.user.name ?? m.user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.user.email}
                        </p>
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
                    <TeamRolePicker
                      value={m.roles}
                      disabled={busy}
                      onChange={(next) => void updateRoles(m.userId, next)}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
