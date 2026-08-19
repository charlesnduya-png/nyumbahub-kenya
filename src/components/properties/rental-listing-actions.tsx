"use client";

import { MessageCircle, Phone } from "lucide-react";

import { ContactSellerForm } from "@/components/properties/contact-seller-form";
import { ScheduleViewingForm } from "@/components/properties/schedule-viewing-form";
import {
  ReserveRentalForm,
  type RentalRoomOption,
} from "@/components/properties/reserve-rental-form";
import { useTenantContactGate } from "@/components/tenant/tenant-access-paywall";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface RentalListingActionsProps {
  propertyId: string;
  propertySlug: string;
  propertyTitle: string;
  price: number;
  currency: string;
  hostUserId?: string;
  whatsappPhone?: string | null;
  whatsappMessage?: string;
  callPhone?: string | null;
  rooms?: RentalRoomOption[];
  /** Sticky bar at bottom on mobile */
  sticky?: boolean;
}

export function RentalListingActions({
  propertyId,
  propertySlug,
  propertyTitle,
  price,
  currency,
  hostUserId,
  whatsappPhone,
  whatsappMessage,
  callPhone,
  rooms = [],
  sticky = false,
}: RentalListingActionsProps) {
  const { runWithAccess, paywall } = useTenantContactGate(
    "chat, reserve, or call landlords",
  );

  const available =
    rooms.length > 0
      ? rooms.filter((r) => r.status === "AVAILABLE").length
      : null;

  const content = (
    <div className={sticky ? "flex flex-col gap-2 sm:flex-row" : "space-y-3"}>
      {available != null ? (
        <p className="text-center text-sm text-muted-foreground sm:text-left">
          {available} of {rooms.length} room{rooms.length === 1 ? "" : "s"}{" "}
          available
        </p>
      ) : null}
      <ReserveRentalForm
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        currency={currency}
        rooms={rooms}
        triggerClassName={sticky ? "flex-1" : "w-full"}
      />
      <ContactSellerForm
        propertyId={propertyId}
        propertyTitle={propertyTitle}
        hostUserId={hostUserId}
        variant="outline"
        label="Message landlord"
      />
      {!sticky ? (
        <ScheduleViewingForm
          propertyId={propertyId}
          propertyTitle={propertyTitle}
        />
      ) : null}
      {whatsappPhone ? (
        <Button
          variant="outline"
          className="w-full"
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
          WhatsApp
        </Button>
      ) : null}
      {callPhone ? (
        <Button
          variant="outline"
          className="w-full"
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
    </div>
  );

  if (sticky) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
        <p className="mb-2 text-center text-sm font-medium">
          {formatPrice(price, { currency })}
          <span className="font-normal text-muted-foreground"> / month</span>
        </p>
        {content}
      </div>
    );
  }

  return content;
}
