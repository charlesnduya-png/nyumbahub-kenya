import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import type { Role } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;

  try {
    session = await auth();
  } catch {
    // Soft-fail during static build when auth is unavailable
  }

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const role = (session.user.role ?? "BUYER") as Role;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar role={role} userName={session.user.name} />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
