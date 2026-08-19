import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function TenantRecentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Recently viewed</h1>
        <p className="text-muted-foreground">
          Homes you opened recently on Your Home.
        </p>
      </div>

      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            You have not viewed any properties yet. Browse listings and they will appear here.
          </p>
          <Button asChild className="mt-4">
            <Link href="/properties">Browse properties</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
