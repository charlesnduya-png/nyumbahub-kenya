import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { resolveProfessionalActingContext } from "@/lib/account-team";

export default async function ProfileOwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/pro/profile");
  }

  const ctx = await resolveProfessionalActingContext(session.user.id);
  if (ctx.isTeamMember) {
    redirect("/dashboard/pro");
  }

  return <>{children}</>;
}
