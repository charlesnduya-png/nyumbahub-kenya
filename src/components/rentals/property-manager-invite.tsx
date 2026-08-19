"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEAM_ROLE_LABEL, type TeamRoleValue } from "@/lib/team-roles";

type TeamMember = {
  userId: string;
  roles: TeamRoleValue[];
  user: { name: string | null; email: string };
};

type TeamInvite = {
  id: string;
  email: string;
  roles: TeamRoleValue[];
  expiresAt: string;
};

function isPropertyManager(roles?: TeamRoleValue[] | null) {
  return Boolean(roles?.includes("RENTALS"));
}

export function PropertyManagerInvite() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<TeamInvite[]>([]);

  async function load() {
    try {
      const res = await fetch("/api/team/members");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMembers([]);
        setInvites([]);
        return;
      }
      setMembers(
        ((json.data?.members ?? []) as TeamMember[]).filter((member) =>
          isPropertyManager(member.roles),
        ),
      );
      setInvites(
        ((json.data?.invites ?? []) as TeamInvite[]).filter((invite) =>
          isPropertyManager(invite.roles),
        ),
      );
    } catch {
      setMembers([]);
      setInvites([]);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function inviteManager() {
    if (!email.trim()) {
      toast.error("Enter the manager's email");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), roles: ["RENTALS"] }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error ?? "Unable to send invitation");
        return;
      }
      setEmail("");
      await load();
      if (json.data?.emailSent) {
        toast.success("Property manager invitation sent");
      } else if (json.data?.joinUrl) {
        try {
          await navigator.clipboard.writeText(json.data.joinUrl);
          toast.success("Invitation created. Join link copied — send it if the email does not arrive.");
        } catch {
          toast.success("Invitation created. Open The team to resend the link.");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UserPlus className="h-5 w-5" />
          Property manager
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Add someone to add plots and keep vacant rooms listed for rent. They
          work in your account. They cannot open all listings, rent payments,
          billing, or your profile.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="manager-email">Manager email</Label>
            <Input
              id="manager-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="manager@example.com"
              disabled={busy}
            />
          </div>
          <Button onClick={() => void inviteManager()} disabled={busy}>
            Invite manager
          </Button>
        </div>
        {members.length > 0 || invites.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {members.map((member) => (
              <li key={member.userId} className="rounded-md border px-3 py-2">
                <p className="font-medium">
                  {member.user.name || member.user.email}
                </p>
                <p className="text-muted-foreground">
                  {member.user.email} ·{" "}
                  {member.roles
                    .map((role) => TEAM_ROLE_LABEL[role] ?? role)
                    .join(", ")}
                </p>
              </li>
            ))}
            {invites.map((invite) => (
              <li key={invite.id} className="rounded-md border px-3 py-2">
                <p className="font-medium">{invite.email}</p>
                <p className="text-muted-foreground">
                  Invitation pending · expires{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("en-KE")}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No property manager yet. You can also assign this role from The team.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
