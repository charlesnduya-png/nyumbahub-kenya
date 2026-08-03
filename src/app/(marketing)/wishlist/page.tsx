"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { PropertyCardItem } from "@/components/properties/property-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockProperties } from "@/data/mock";
import type { PropertyCard } from "@/types";

export default function WishlistPage() {
  const [favorites, setFavorites] = useState<PropertyCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/favorites");
        const json = await res.json();

        if (json.success && json.data?.length > 0) {
          setFavorites(
            json.data.map(
              (f: { property: PropertyCard & { images?: PropertyCard["images"] } }) => ({
                ...f.property,
                primaryImage: f.property.images?.[0] ?? null,
              }),
            ),
          );
        } else {
          setFavorites(mockProperties.slice(0, 2));
        }
      } catch {
        setFavorites(mockProperties.slice(0, 2));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="text-xl font-bold text-primary">
            NyumbaHub Kenya
          </Link>
          <Link href="/login" className="text-sm text-primary">
            Sign in to sync wishlist
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-3">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Your wishlist</h1>
            <p className="text-muted-foreground">
              Saved properties across Kenya — sign in to sync across devices
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading saved properties…</p>
        ) : favorites.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">
                No saved properties yet. Tap the heart on any listing to add it here.
              </p>
              <Button asChild className="mt-4">
                <Link href="/properties">Browse properties</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((property) => (
              <PropertyCardItem key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
