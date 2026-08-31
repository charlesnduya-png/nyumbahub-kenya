import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import {
  hasProfessionalWorkspaceAccess,
  resolveProfessionalActingContext,
} from "@/lib/account-team";
import { isSiteOwnerEmail, SITE_OWNER_COOKIE } from "@/lib/site-owner";

/** Professional workspace — site owner is never allowed here. */
export default async function ProLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const jar = await cookies();
  const ownerCookie = jar.get(SITE_OWNER_COOKIE)?.value === "1";

  if (
    ownerCookie ||
    isSiteOwnerEmail(session?.user?.email) ||
    session?.user?.role === "ADMIN"
  ) {
    redirect("/dashboard/admin");
  }

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/pro");
  }

  try {
    const ctx = await resolveProfessionalActingContext(session.user.id);
    if (!hasProfessionalWorkspaceAccess(ctx)) {
      redirect("/dashboard/tenant");
    }
  } catch (error) {
    console.error("Professional workspace check failed:", error);
    if (session.user.role !== "SELLER" && session.user.role !== "AGENT") {
      if (session.user.role === "JOB_PARTNER") {
        redirect("/dashboard/jobs");
      }
      redirect("/dashboard/tenant");
    }
  }

  return <>{children}</>;
}
