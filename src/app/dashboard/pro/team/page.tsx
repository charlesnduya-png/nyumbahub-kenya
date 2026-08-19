import { auth } from "@/lib/auth";
import { TeamManager } from "@/components/professional/team-manager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { TEAM_ROLE_LABEL, type TeamRoleValue } from "@/lib/team-roles";

export default async function ProTeamPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const ownerName = ctx.actingOwnerName || "this professional";
  const roleLabels = ctx.teamMemberRoles.map(
    (role) => TEAM_ROLE_LABEL[role as TeamRoleValue] ?? role,
  );

  if (ctx.permissions.manageTeam) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">The team</h1>
          <p className="text-muted-foreground">
            {ctx.isTeamMember
              ? `You are on ${ownerName}'s team. Invite people by email and assign one or more roles.`
              : "Invite people by email, give them one or more roles, and they join this workspace after accepting."}
          </p>
        </div>

        <div className="mx-auto max-w-2xl">
          <TeamManager />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The team</h1>
        <p className="text-muted-foreground">
          This is the professional account you belong to, and the access assigned to you.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Your membership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              You belong to <span className="font-medium">{ownerName}</span>
              &apos;s team.
            </p>
            <div className="flex flex-wrap gap-2">
              {roleLabels.length > 0 ? (
                roleLabels.map((label) => (
                  <Badge key={label} variant="secondary">
                    {label}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary">No roles assigned</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Listings, inbox, and other pages follow these roles on {ownerName}
              &apos;s account — not a separate account of your own.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
