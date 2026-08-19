import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SiteTrafficDashboard } from "@/components/dashboard/site-traffic-dashboard";

export default function AdminTrafficPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading site traffic…
        </div>
      }
    >
      <SiteTrafficDashboard />
    </Suspense>
  );
}
