import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isSiteOwnerEmail } from "@/lib/site-owner";

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/admin&owner=1");
  }

  const isOwner =
    isSiteOwnerEmail(session.user.email) || session.user.role === "ADMIN";

  if (!isOwner) {
    // Never bounce non-owners into /dashboard/pro
    redirect("/login?callbackUrl=/dashboard/admin&owner=1&error=owner-required");
  }

  return <>{children}</>;
}
