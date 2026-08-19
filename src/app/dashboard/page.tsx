import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { dashboardHomeForRole } from "@/lib/site-owner";

export default async function DashboardPage() {
  let session = null;

  try {
    session = await auth();
  } catch {
    redirect("/login");
  }

  if (!session?.user) {
    redirect("/login");
  }

  redirect(
    dashboardHomeForRole(session.user.role, session.user.email),
  );
}
