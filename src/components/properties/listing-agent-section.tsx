import Link from "next/link";

import { ListingHostRow } from "@/components/properties/listing-host-row";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ListingHostSummary } from "@/types";

interface ListingAgentSectionProps {
  host: ListingHostSummary | null | undefined;
  className?: string;
}

export function ListingAgentSection({ host, className }: ListingAgentSectionProps) {
  if (!host?.name) return null;

  const title =
    host.role === "AGENT" ? "Agent" : "Listed by";

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ListingHostRow host={host} size="lg" />
        {host.agentProfileId ? (
          <Link
            href={`/agents/${host.agentProfileId}`}
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            View agent profile
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
