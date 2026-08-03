import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { tenantInquiries } from "@/data/tenant";
import { formatRelativeDate } from "@/lib/utils";

export default function TenantInquiriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My inquiries</h1>
        <p className="text-muted-foreground">
          Messages you sent to landlords, sellers, and agents.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inquiry history ({tenantInquiries.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenantInquiries.map((i) => (
            <div key={i.id} className="rounded-xl border p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <Link
                  href={`/properties/${i.propertySlug}`}
                  className="font-medium text-primary hover:underline"
                >
                  {i.propertyTitle}
                </Link>
                <Badge
                  variant={
                    i.status === "VIEWING"
                      ? "default"
                      : i.status === "REPLIED"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {i.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{i.message}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Sent {formatRelativeDate(i.createdAt)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
