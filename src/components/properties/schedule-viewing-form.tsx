"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ScheduleViewingFormProps {
  propertyId: string;
  propertyTitle: string;
}

function minSelectableDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function ScheduleViewingForm({
  propertyId,
  propertyTitle,
}: ScheduleViewingFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const { runWithAccess, paywall, canContact, loading: accessLoading } =
    useTenantContactGate("book a viewing");

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
  const minDate = minSelectableDate();
  const sessionLoading = status === "loading";

  async function submit() {
    if (!session?.user) {
      toast.error("Sign in to book a viewing");
      return;
    }
    if (!date || !time) {
      toast.error("Choose a date and time");
      return;
    }

    const scheduledAt = new Date(`${date}T${time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) {
      toast.error("Invalid date or time");
      return;
    }

    if (scheduledAt.getTime() < Date.now() - 60_000) {
      toast.error("Pick a future date and time");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/viewings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          scheduledAt: scheduledAt.toISOString(),
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
        redirectTo?: string;
      };

      if (!res.ok || !json.success) {
        if (json.code === "TENANT_ACCESS_REQUIRED") {
          toast.error(json.error ?? "Viewing pass required");
          setOpen(false);
          runWithAccess(() => setOpen(true));
          return;
        }
        toast.error(json.error ?? "Could not book viewing");
        return;
      }

      toast.success("Viewing request sent! The agent will confirm your slot.");
      setOpen(false);
      router.push(json.redirectTo ?? "/dashboard/tenant/viewings");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  function openDialog() {
    if (sessionLoading) {
      toast.message("Checking your account…");
      return;
    }

    if (status !== "authenticated") {
      router.push(loginHref);
      return;
    }

    // Open immediately when contact access is free or already unlocked.
    if (canContact && !accessLoading) {
      setOpen(true);
      return;
    }

    runWithAccess(() => setOpen(true));
  }

  return (
    <>
      <Button
        variant="secondary"
        className="w-full"
        type="button"
        disabled={sessionLoading}
        onClick={openDialog}
      >
        {sessionLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </>
        ) : (
          <>
            <CalendarDays className="mr-2 h-4 w-4" />
            Book a viewing
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book a viewing</DialogTitle>
            <DialogDescription>
              Request a property visit for {propertyTitle}. The listing agent
              will confirm your time slot.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="viewing-date">Preferred date</Label>
                <Input
                  id="viewing-date"
                  type="date"
                  min={minDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="viewing-time">Time</Label>
                <Input
                  id="viewing-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="viewing-phone">Your phone (optional)</Label>
              <Input
                id="viewing-phone"
                type="tel"
                placeholder="07XX XXX XXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="viewing-notes">Message (optional)</Label>
              <Textarea
                id="viewing-notes"
                placeholder="I'm interested in viewing this weekend…"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Request viewing"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {paywall}
    </>
  );
}
