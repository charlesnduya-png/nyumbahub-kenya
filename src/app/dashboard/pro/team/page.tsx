import { TeamManager } from "@/components/professional/team-manager";

export default function ProTeamPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">The team</h1>
        <p className="text-muted-foreground">
          Invite people by email, give them one or more roles, and they join
          after creating an account from the invitation.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <TeamManager />
      </div>
    </div>
  );
}
