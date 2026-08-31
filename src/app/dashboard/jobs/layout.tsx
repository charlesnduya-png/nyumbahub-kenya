import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSiteOwnerEmail } from "@/lib/site-owner";

export default async function JobsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (
    isSiteOwnerEmail(session?.user?.email) ||
    session?.user?.role === "ADMIN"
  ) {
    redirect("/dashboard/admin");
  }

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/jobs");
  }

  if (session.user.role !== "JOB_PARTNER") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
