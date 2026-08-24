"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { BadgePercent } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const SHOWN_KEY = "yh-signin-save-shown";

function alreadyHandled() {
  try {
    return sessionStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

function markShown() {
  try {
    sessionStorage.setItem(SHOWN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function SignInSavePopup() {
  const pathname = usePathname();
  const { status } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (status !== "unauthenticated") return;
    if (
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/dashboard")
    ) {
      return;
    }
    if (alreadyHandled()) return;

    const timer = window.setTimeout(() => {
      if (alreadyHandled()) return;
      markShown();
      setOpen(true);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [status, pathname]);

  function close() {
    setOpen(false);
    markShown();
  }

  const callbackUrl = encodeURIComponent(pathname || "/");

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="overflow-hidden border-0 p-0 sm:max-w-[420px] sm:rounded-2xl">
        <div className="bg-primary px-6 pb-8 pt-8 text-primary-foreground">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <BadgePercent className="h-3.5 w-3.5" aria-hidden />
            Member deal
          </div>
          <DialogTitle className="font-display text-3xl font-semibold tracking-tight text-white">
            Sign in, save money
          </DialogTitle>
        </div>
        <div className="space-y-5 px-6 py-5">
          <DialogDescription className="text-base leading-relaxed text-foreground">
            Sign in to save 10% or more with a free Your Home membership.
          </DialogDescription>
          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full rounded-xl">
              <Link href={`/login?callbackUrl=${callbackUrl}`} onClick={close}>
                Sign in
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full rounded-xl"
            >
              <Link
                href={`/register?callbackUrl=${callbackUrl}`}
                onClick={close}
              >
                Create a free account
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
