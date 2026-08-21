import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SignInToUnlock({
  title,
  description,
  callbackPath,
  className,
  minHeightClassName = "min-h-[220px]",
  children,
}: {
  title: string;
  description?: string;
  callbackPath: string;
  className?: string;
  minHeightClassName?: string;
  children?: React.ReactNode;
}) {
  const loginHref = `/login?callbackUrl=${encodeURIComponent(callbackPath)}`;
  const registerHref = `/register?callbackUrl=${encodeURIComponent(callbackPath)}`;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card",
        className,
      )}
    >
      {children ? (
        <div
          className="pointer-events-none select-none blur-[6px]"
          aria-hidden
        >
          {children}
        </div>
      ) : (
        <div className={cn("bg-muted/40", minHeightClassName)} />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/75 p-6 text-center backdrop-blur-[2px]">
        <Lock className="mb-3 h-8 w-8 text-primary" />
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href={loginHref}>Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={registerHref}>Create free account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
