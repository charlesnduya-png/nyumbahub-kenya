import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";

/** Team members belong in the professional workspace, even with a stale JWT. */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.id) {
    if (session.user.role === "JOB_PARTNER") {
      redirect("/dashboard/jobs");
    }
    try {
      const ctx = await resolveProfessionalActingContext(session.user.id);
      if (ctx.isTeamMember) {
        redirect("/dashboard/pro");
      }
    } catch (error) {
      console.error("Tenant team redirect failed:", error);
    }
  }

  return <>{children}</>;
}
