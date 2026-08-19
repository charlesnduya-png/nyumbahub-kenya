import { AgentVerificationManager } from "@/components/admin/agent-verification-manager";
import {
  getAdminVerificationAgents,
  getAdminVerificationLandlords,
} from "@/lib/admin-verification";

export default async function AdminVerificationPage() {
  const [agents, landlords] = await Promise.all([
    getAdminVerificationAgents(),
    getAdminVerificationLandlords(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Verify accounts</h1>
        <p className="text-muted-foreground">
          All agents and landlords appear below. Toggle verified for anyone you
          want to approve.
        </p>
      </div>

      <AgentVerificationManager
        initialAgents={agents}
        initialLandlords={landlords}
      />
    </div>
  );
}
