import Image from "next/image";
import Link from "next/link";

import type { BrowseCategory } from "@/lib/marketing";

interface CategoriesProps {
  categories: BrowseCategory[];
  title?: string;
  subtitle?: string;
}

export function Categories({
  categories,
  title = "Browse by Category",
  subtitle = "Find the perfect property type for your needs",
}: CategoriesProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="cv-auto py-16 sm:py-20" aria-labelledby="categories-heading">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2
            id="categories-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            {title}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
            {subtitle}
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={
                category.slug === "bnb"
                  ? "/bnb"
                  : category.slug === "land-plots"
                    ? "/properties?category=land-plots"
                    : category.slug === "commercial"
                      ? "/properties?category=commercial"
                      : `/properties?propertyType=${category.propertyType}`
              }
              className="group relative z-10 block overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={category.image}
                  alt={category.label}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  quality={70}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-display text-xl font-semibold text-white">
                    {category.label}
                  </h3>
                  <p className="mt-1 text-sm text-white/80">
                    {category.listingCount.toLocaleString()} listings
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
