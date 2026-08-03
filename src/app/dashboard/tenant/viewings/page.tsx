import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantViewings } from "@/data/tenant";
import { formatDate } from "@/lib/utils";

export default function TenantViewingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My viewings</h1>
        <p className="text-muted-foreground">
          Scheduled property visits with sellers and agents.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {tenantViewings.map((v) => (
          <Card key={v.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2">
              <CardTitle className="text-base">{v.propertyTitle}</CardTitle>
              <Badge>{v.status}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="flex items-center gap-2 text-sm">
                <CalendarDays className="h-4 w-4 text-primary" />
                {formatDate(v.scheduledAt, "EEEE, dd MMM yyyy · HH:mm")}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {v.location}
              </p>
              <p className="text-sm">Host: {v.agentName}</p>
              <Button size="sm" asChild>
                <Link href={`/properties/${v.propertySlug}`}>
                  View listing
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
