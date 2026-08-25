import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";
import { isSiteOwnerEmail } from "@/lib/site-owner";

export default async function NewPropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent("/dashboard/seller/properties/new")}`,
    );
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  const isAdmin =
    session.user.role === "ADMIN" || isSiteOwnerEmail(session.user.email);
  if (!isAdmin && !ctx.permissions.manageListings) {
    redirect("/dashboard/pro");
  }

  return <>{children}</>;
}
