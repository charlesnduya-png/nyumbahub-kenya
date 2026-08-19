import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";

export default async function PromoteOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/seller/promote");
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (ctx.isTeamMember) {
    redirect("/dashboard/pro");
  }

  return <>{children}</>;
}
