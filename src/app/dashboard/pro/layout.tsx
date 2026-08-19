import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
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

  return <>{children}</>;
}
