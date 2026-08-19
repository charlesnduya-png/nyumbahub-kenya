"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactSellerFormProps {
  propertyId: string;
  propertyTitle: string;
  hostUserId?: string;
  variant?: "default" | "outline" | "secondary";
  label?: string;
  /** Keep dialog for logged-in users instead of inbox redirect only */
  preferDialog?: boolean;
}

export function ContactSellerForm({
  propertyId,
  propertyTitle,
  hostUserId,
  variant = "default",
  label = "Contact seller",
  preferDialog = false,
}: ContactSellerFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { runWithAccess, paywall } = useTenantContactGate("chat with landlords");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const message = String(formData.get("message") ?? "").trim();

    try {
      if (status === "authenticated" && session?.user && hostUserId) {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receiverId: hostUserId,
            propertyId,
            content:
              message ||
              `Hi, I'm interested in ${propertyTitle} on Your Home.`,
          }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
          code?: string;
        };

        if (!res.ok || !json.success) {
          if (json.code === "TENANT_ACCESS_REQUIRED") {
            toast.error(json.error ?? "Viewing pass required");
            setOpen(false);
            runWithAccess(() => setOpen(true));
            return;
          }
          toast.error(json.error ?? "Unable to send message");
          return;
        }

        toast.success("Message sent! Continue in your inbox.");
        setOpen(false);
        router.push(
          `/dashboard/tenant/messages?peer=${hostUserId}&property=${propertyId}`,
        );
        return;
      }

      toast.error("Sign in and unlock a 24-hour viewing pass to contact landlords.");
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "authenticated" && hostUserId && !preferDialog) {
    return (
      <>
        <Button
          className="w-full"
          variant={variant}
          onClick={() =>
            runWithAccess(() =>
              router.push(
                `/dashboard/tenant/messages?peer=${hostUserId}&property=${propertyId}`,
              ),
            )
          }
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {label}
        </Button>
        {paywall}
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <Button
          className="w-full"
          variant={variant}
          onClick={() => runWithAccess(() => setOpen(true))}
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {label}
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enquire about {propertyTitle}</DialogTitle>
          </DialogHeader>
          {status !== "authenticated" ? (
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>{" "}
              and pay KES 150 for a 24-hour viewing pass to chat with the host.
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="space-y-4">
            {status === "authenticated" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="I'm interested in viewing this property…"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending…" : "Send message"}
                </Button>
              </>
            ) : (
              <Button asChild className="w-full">
                <Link href={`/login?callbackUrl=${encodeURIComponent(pathname)}`}>
                  Sign in to continue
                </Link>
              </Button>
            )}
          </form>
        </DialogContent>
      </Dialog>
      {paywall}
    </>
  );
}
