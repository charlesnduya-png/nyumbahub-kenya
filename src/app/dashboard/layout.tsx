import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { isSiteOwnerEmail } from "@/lib/site-owner";
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

  const owner = isSiteOwnerEmail(session.user.email);
  const role = (owner ? "ADMIN" : (session.user.role ?? "BUYER")) as Role;

  return (
    <DashboardShell role={role} userName={session.user.name}>
      {children}
    </DashboardShell>
  );
}
