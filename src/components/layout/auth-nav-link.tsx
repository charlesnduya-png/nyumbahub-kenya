"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { dashboardHomeForRole } from "@/lib/site-owner";

export function AuthNavLink({
  className,
}: {
  className?: string;
}) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className={className}>…</span>;
  }

  if (session?.user) {
    return (
      <Link
        href={dashboardHomeForRole(session.user.role, session.user.email)}
        className={className}
      >
        Dashboard
      </Link>
    );
  }

  return (
    <Link href="/login" className={className}>
      Sign in
    </Link>
  );
}
