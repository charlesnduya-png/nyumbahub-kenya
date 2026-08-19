import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  hasProfessionalWorkspaceAccess,
  resolveProfessionalActingContext,
} from "@/lib/account-team";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard/seller");
  }

  try {
    const ctx = await resolveProfessionalActingContext(session.user.id);
    if (!hasProfessionalWorkspaceAccess(ctx)) {
      redirect("/dashboard/tenant");
    }
  } catch (error) {
    console.error("Seller workspace check failed:", error);
    if (session.user.role !== "SELLER" && session.user.role !== "AGENT") {
      redirect("/dashboard/tenant");
    }
  }

  return <>{children}</>;
}
