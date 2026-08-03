import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

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

  const role = session.user.role ?? "BUYER";

  switch (role) {
    case "SELLER":
    case "AGENT":
      redirect("/dashboard/pro");
    case "ADMIN":
      redirect("/dashboard/admin");
    default:
      redirect("/dashboard/tenant");
  }
}
