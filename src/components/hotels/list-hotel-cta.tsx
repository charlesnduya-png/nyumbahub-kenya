"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { addHotelPath, listHotelHref } from "@/lib/hotel-listing";

export function ListHotelCta({
  children = "List a hotel",
  size,
  variant,
  className,
}: {
  children?: React.ReactNode;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  className?: string;
}) {
  const { data: session, status } = useSession();
  const href =
    status === "loading"
      ? addHotelPath()
      : listHotelHref({
          isLoggedIn: status === "authenticated" && Boolean(session?.user),
          role: session?.user?.role,
        });

  return (
    <Button size={size} variant={variant} className={className} asChild>
      <Link href={href}>{children}</Link>
    </Button>
  );
}
