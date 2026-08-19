"use client";

import { MessageCircle, Phone } from "lucide-react";

import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";
import { Button } from "@/components/ui/button";

interface GatedContactLinksProps {
  whatsappPhone?: string | null;
  whatsappMessage?: string;
  callPhone?: string | null;
  whatsappLabel?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary";
}

export function GatedContactLinks({
  whatsappPhone,
  whatsappMessage,
  callPhone,
  whatsappLabel = "WhatsApp",
  className = "w-full",
  variant = "outline",
}: GatedContactLinksProps) {
  const { runWithAccess, paywall } = useTenantContactGate(
    "chat or call landlords",
  );

  if (!whatsappPhone && !callPhone) return null;

  return (
    <>
      {whatsappPhone ? (
        <Button
          variant={variant}
          className={className}
          type="button"
          onClick={() =>
            runWithAccess(() => {
              window.open(
                `https://wa.me/${whatsappPhone}?text=${whatsappMessage ?? ""}`,
                "_blank",
                "noopener,noreferrer",
              );
            })
          }
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          {whatsappLabel}
        </Button>
      ) : null}
      {callPhone ? (
        <Button
          variant={variant}
          className={className}
          type="button"
          onClick={() =>
            runWithAccess(() => {
              window.location.href = `tel:${callPhone}`;
            })
          }
        >
          <Phone className="mr-2 h-4 w-4" />
          Call
        </Button>
      ) : null}
      {paywall}
    </>
  );
}
