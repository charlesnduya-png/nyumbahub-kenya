"use client";

import { Heart } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteToggle() {
  const [favorited, setFavorited] = React.useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-3 top-3 z-20 h-9 w-9 rounded-full bg-white/90 text-foreground backdrop-blur-sm hover:bg-white dark:bg-black/70 dark:text-white dark:hover:bg-black/90",
        favorited && "text-red-500 hover:text-red-600",
      )}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorited((prev) => !prev);
      }}
      aria-label={favorited ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={favorited}
    >
      <Heart
        className={cn("h-4 w-4", favorited && "fill-current")}
        aria-hidden="true"
      />
    </Button>
  );
}
