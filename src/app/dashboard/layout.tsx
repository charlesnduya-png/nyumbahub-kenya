import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { isSiteOwnerEmail } from "@/lib/site-owner";
import type { TeamNavState } from "@/lib/team-roles";
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
  let ctx = null;
  try {
    ctx = session.user.id
      ? await resolveProfessionalActingContext(session.user.id)
      : null;
  } catch (error) {
    console.error("Dashboard team context failed:", error);
  }
  const role = (
    owner
      ? "ADMIN"
      : ctx?.isTeamMember &&
          (ctx.actingOwnerRole === "SELLER" || ctx.actingOwnerRole === "AGENT")
        ? ctx.actingOwnerRole
        : (session.user.role ?? "BUYER")
  ) as Role;

  const team: TeamNavState | null =
    ctx?.isTeamMember
      ? {
          isTeamMember: true,
          ownerName: ctx.actingOwnerName || "your team owner",
          roles: ctx.teamMemberRoles as TeamNavState["roles"],
          permissions: ctx.permissions,
        }
      : null;

  return (
    <DashboardShell role={role} userName={session.user.name} team={team}>
      {children}
    </DashboardShell>
  );
}
