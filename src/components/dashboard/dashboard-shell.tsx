"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Role } from "@/types";
import type { TeamNavState } from "@/lib/team-roles";

interface DashboardShellProps {
  role: Role;
  userName?: string | null;
  team?: TeamNavState | null;
  children: React.ReactNode;
}

export function DashboardShell({
  role,
  userName,
  team,
  children,
}: DashboardShellProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 lg:flex lg:h-dvh lg:sticky lg:top-0">
        <DashboardSidebar role={role} userName={userName} team={team} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4 lg:justify-end lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Dashboard menu</SheetTitle>
              </SheetHeader>
              <DashboardSidebar
                role={role}
                userName={userName}
                team={team}
                onNavigate={() => setOpen(false)}
                className="h-full border-0"
              />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
