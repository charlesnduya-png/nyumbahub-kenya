"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/lib/utils";

type ListingsUser = {
  id: string;
  name: string;
  email: string;
};

type UserListing = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency: string;
  listingType: string;
  propertyType: string;
  status: string;
  county: string;
  town: string;
  views: number;
  createdAt: string;
  imageUrl: string | null;
  asOwner: boolean;
  asAgent: boolean;
};

export function UserListingsDialog({
  user,
  open,
  onOpenChange,
}: {
  user: ListingsUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState<UserListing[]>([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/listings`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Could not load listings");
        setListings([]);
        return;
      }
      setListings(json.data?.listings ?? []);
    } catch {
      toast.error("Could not load listings");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (open && user) void load();
  }, [open, user, load]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Listings — {user?.name}</DialogTitle>
          <DialogDescription>
            {user?.email} · Properties posted as owner or agent.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 py-8 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading listings…
          </div>
        ) : listings.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No listings yet for this account.
          </p>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <div
                key={listing.id}
                className="flex gap-3 rounded-lg border p-3"
              >
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.imageUrl}
                    alt=""
                    className="h-16 w-20 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug">{listing.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {listing.town}, {listing.county} ·{" "}
                    {formatPrice(listing.price, {
                      currency: listing.currency,
                    })}
                    {listing.listingType === "RENT" ? "/mo" : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline">{listing.status}</Badge>
                    <Badge variant="secondary">{listing.listingType}</Badge>
                    {listing.asOwner ? (
                      <Badge variant="secondary">Owner</Badge>
                    ) : null}
                    {listing.asAgent ? (
                      <Badge variant="secondary">Agent</Badge>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/properties/${listing.slug}`} target="_blank">
                      <ExternalLink className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/dashboard/admin/properties">Manage</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
