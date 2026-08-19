"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Calendar, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/utils";
import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";

export interface RentalRoomOption {
  id: string;
  label: string;
  floor?: string | null;
  price?: number | null;
  status: "AVAILABLE" | "RENTED";
}

interface ReserveRentalFormProps {
  propertyId: string;
  propertyTitle: string;
  currency?: string;
  rooms?: RentalRoomOption[];
  /** Compact trigger for cards / mobile bar */
  triggerClassName?: string;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ReserveRentalForm({
  propertyId,
  propertyTitle,
  currency = "KES",
  rooms = [],
  triggerClassName,
}: ReserveRentalFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [moveInDate, setMoveInDate] = useState("");
  const [message, setMessage] = useState("");
  const [roomId, setRoomId] = useState("");
  const [busy, setBusy] = useState(false);

  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE");
  const multiRoom = rooms.length > 0;

  useEffect(() => {
    const available = rooms.filter((r) => r.status === "AVAILABLE");
    if (available.length === 1) {
      setRoomId((prev) => prev || available[0].id);
    }
  }, [rooms]);

  const loginHref = `/login?callbackUrl=${encodeURIComponent(pathname)}`;
  const { runWithAccess, paywall } = useTenantContactGate("reserve this rental");

  async function submit() {
    if (!session?.user) {
      toast.error("Sign in to reserve this rental");
      return;
    }

    if (multiRoom && !roomId) {
      toast.error("Choose which room you want to reserve");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(
        `/api/properties/${propertyId}/rental-reservations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moveInDate: moveInDate || undefined,
            message: message.trim() || undefined,
            rentalRoomId: roomId || undefined,
          }),
        },
      );
      const json = await res.json();

      if (!res.ok) {
        if (json.code === "TENANT_ACCESS_REQUIRED") {
          toast.error(json.error ?? "Viewing pass required");
          setOpen(false);
          runWithAccess(() => setOpen(true));
          return;
        }
        toast.error(json.error ?? "Could not submit reservation");
        return;
      }

      toast.success(json.message ?? "Reservation submitted");
      setOpen(false);
      setMoveInDate("");
      setMessage("");
      setRoomId(availableRooms.length === 1 ? availableRooms[0].id : "");
      router.push("/dashboard/tenant/rental-reservations");
    } catch {
      toast.error("Could not submit reservation");
    } finally {
      setBusy(false);
    }
  }

  if (status !== "loading" && !session?.user) {
    return (
      <Button className={triggerClassName ?? "w-full"} size="lg" asChild>
        <Link href={loginHref}>
          <KeyRound className="mr-2 h-4 w-4" />
          Sign in to reserve
        </Link>
      </Button>
    );
  }

  if (multiRoom && availableRooms.length === 0) {
    return (
      <Button className={triggerClassName ?? "w-full"} size="lg" disabled>
        All rooms rented
      </Button>
    );
  }

  return (
    <>
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          runWithAccess(() => setOpen(true));
          return;
        }
        setOpen(false);
      }}
    >
      <DialogTrigger asChild>
        <Button
          className={triggerClassName ?? "w-full"}
          size="lg"
          disabled={status === "loading"}
          onClick={(e) => {
            e.preventDefault();
            runWithAccess(() => setOpen(true));
          }}
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <KeyRound className="mr-2 h-4 w-4" />
          )}
          {multiRoom ? "Reserve a room" : "Reserve this rental"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reserve {propertyTitle}</DialogTitle>
          <DialogDescription>
            {multiRoom
              ? "Pick an available room. The house listing stays public until every room is booked."
              : "Submit your rental request. The landlord and admin will review it."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {multiRoom ? (
            <div className="space-y-2">
              <Label>Room</Label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.label}
                      {room.floor ? ` · Floor ${room.floor}` : ""}
                      {room.price != null
                        ? ` · ${formatPrice(room.price, { currency })}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="move-in">Preferred move-in date</Label>
            <Input
              id="move-in"
              type="date"
              min={todayIsoDate()}
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rental-message">Message (optional)</Label>
            <Textarea
              id="rental-message"
              placeholder="12-month lease, 2 adults…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Submit reservation
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {paywall}
    </>
  );
}
