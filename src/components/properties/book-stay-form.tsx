"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { nightsBetween } from "@/lib/validations/booking";

interface BookStayFormProps {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  pricePerNight: number;
  currency?: string;
  hostUserId?: string;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function BookStayForm({
  propertyId,
  propertySlug,
  propertyTitle,
  pricePerNight,
  currency = "KES",
  hostUserId,
}: BookStayFormProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [message, setMessage] = useState("");
  const { runWithAccess, paywall } = useTenantContactGate("book this BnB");

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return 0;
    }
    return nightsBetween(start, end);
  }, [checkIn, checkOut]);

  const total = nights * pricePerNight;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (status !== "authenticated" || !session?.user) {
      toast.error("Sign in to book this stay on Your Home.");
      return;
    }

    runWithAccess(() => {
      void (async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/bookings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propertyId,
              checkIn,
              checkOut,
              guests,
              guestMessage: message || undefined,
            }),
          });
          const json = (await res.json()) as {
            success?: boolean;
            error?: string;
            code?: string;
            hostUserId?: string;
            propertyId?: string;
          };

          if (!res.ok || !json.success) {
            if (json.code === "TENANT_ACCESS_REQUIRED") {
              toast.error(json.error ?? "Viewing pass required");
              return;
            }
            toast.error(json.error ?? "Could not send booking request");
            return;
          }

          toast.success("Booking sent! Open your inbox to chat with the host.");
          setMessage("");

          const hostId = json.hostUserId ?? hostUserId;
          const propId = json.propertyId ?? propertyId;
          if (hostId) {
            router.push(
              `/dashboard/tenant/messages?peer=${hostId}&property=${propId}`,
            );
          } else {
            router.push("/dashboard/tenant/bookings");
          }
        } catch {
          toast.error("Something went wrong. Please try again.");
        } finally {
          setLoading(false);
        }
      })();
    });
  }

  if (status !== "authenticated") {
    return (
      <div className="space-y-3 rounded-xl border border-dashed p-4">
        <p className="text-sm font-medium">Book this BnB on Your Home</p>
        <p className="text-sm text-muted-foreground">
          Sign in to pick dates and send a booking request. You can chat with the
          host inside Your Home while they review your stay.
        </p>
        <Button className="w-full" asChild>
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(`/properties/${propertySlug}`)}`}
          >
            Sign in to book
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <p className="text-sm font-medium">Book stay · {propertyTitle}</p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(pricePerNight, { currency })} / night · book & chat on
          Your Home
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="checkIn">Check-in</Label>
          <Input
            id="checkIn"
            type="date"
            required
            min={todayIsoDate()}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkOut">Check-out</Label>
          <Input
            id="checkOut"
            type="date"
            required
            min={checkIn || todayIsoDate()}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="guests">Guests</Label>
        <Input
          id="guests"
          type="number"
          min={1}
          max={30}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value) || 1)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bookingMessage">Message to host (optional)</Label>
        <Textarea
          id="bookingMessage"
          rows={3}
          placeholder="Arrival time, special requests…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {nights > 0 ? (
        <p className="text-sm text-muted-foreground">
          {nights} night{nights === 1 ? "" : "s"} ·{" "}
          <span className="font-semibold text-foreground">
            {formatPrice(total, { currency })}
          </span>
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading || nights < 1}>
        {loading ? "Booking…" : "Book on Your Home"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Your booking goes to the host/agent inbox. Continue the conversation in{" "}
        <Link href="/dashboard/tenant/messages" className="text-primary hover:underline">
          Messages
        </Link>
        . A KES 150 viewing pass is required for 24 hours of contact.
      </p>
    </form>
    {paywall}
    </>
  );
}
