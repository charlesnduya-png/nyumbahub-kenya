import { AnimatedHero } from "@/components/home/animated-hero";
import { Categories } from "@/components/home/categories";
import { CtaSection } from "@/components/home/cta-section";
import { FeaturedAgents } from "@/components/home/featured-agents";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { HomeFaq } from "@/components/home/home-faq";
import { LatestBlog } from "@/components/home/latest-blog";
import { LatestProperties } from "@/components/home/latest-properties";
import { MortgageCalculator } from "@/components/home/mortgage-calculator";
import { TopLocations } from "@/components/home/top-locations";
import { getPublishedBlogPosts } from "@/lib/blog";
import { getFeaturedAgentsForHome } from "@/lib/featured-agents";
import { getBrowseCategories, getTopLocations } from "@/lib/marketing";
import {
  getBnbPropertiesForHome,
  getFeaturedPropertiesForHome,
  getLatestPropertiesForHome,
  getRentalPropertiesForHome,
} from "@/lib/properties";
import { buildPageMetadata, homeFaqJsonLd } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Kenya Real Estate — Houses for Sale, Rent, Land & BnB",
  description:
    "Your Home (yourhome.co.ke) — search verified houses, apartments, land, plots, and rentals in Nairobi, Mombasa, Kisumu, Nakuru, and all Kenya. Free listings for sellers and agents.",
  path: "/",
  keywords: [
    "Kenya real estate website",
    "property search Kenya",
    "houses for sale Nairobi",
    "houses for rent Kenya",
    "land for sale Kenya",
    "BnB Kenya",
    "list property free Kenya",
  ],
});

// This page must update immediately when rentals are marked RENTED.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [
    featuredAgents,
    featuredProperties,
    rentalProperties,
    bnbProperties,
    latestProperties,
    categories,
    locations,
    blogPosts,
  ] = await Promise.all([
    getFeaturedAgentsForHome(4),
    getFeaturedPropertiesForHome(8),
    getRentalPropertiesForHome(8),
    getBnbPropertiesForHome(8),
    getLatestPropertiesForHome(8),
    getBrowseCategories(),
    getTopLocations(6),
    getPublishedBlogPosts(3),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(homeFaqJsonLd()),
        }}
      />
      <AnimatedHero />

      <div className="gradient-mesh">
        <FeaturedProperties properties={featuredProperties} />
        <FeaturedProperties
          properties={rentalProperties}
          title="Houses & apartments for rent"
          subtitle="Monthly rentals across Nairobi, Kisumu, Mombasa and beyond"
          viewAllHref="/rent"
          viewAllLabel="Browse all rentals"
        />
        <FeaturedProperties
          properties={bnbProperties}
          title="BnB & holiday stays"
          subtitle="Beach villas, city Airbnbs, lake cottages — priced per night"
          viewAllHref="/bnb"
          viewAllLabel="Browse all BnBs"
        />
        <Categories categories={categories} />
        <LatestProperties properties={latestProperties} />
        <TopLocations locations={locations} />
        <FeaturedAgents agents={featuredAgents} />
        <MortgageCalculator />
        <HomeFaq />
        <LatestBlog posts={blogPosts} />
        <CtaSection />
      </div>
    </>
  );
}
