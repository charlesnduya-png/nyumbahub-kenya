import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminUsersPage from "./users-client";

export default function AdminUsersRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading accounts…
        </div>
      }
    >
      <AdminUsersPage />
    </Suspense>
  );
}
