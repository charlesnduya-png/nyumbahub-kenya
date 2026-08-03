import { AnimatedHero } from "@/components/home/animated-hero";
import { Categories } from "@/components/home/categories";
import { CtaSection } from "@/components/home/cta-section";
import { FeaturedAgents } from "@/components/home/featured-agents";
import { FeaturedProperties } from "@/components/home/featured-properties";
import { LatestBlog } from "@/components/home/latest-blog";
import { LatestProperties } from "@/components/home/latest-properties";
import { MortgageCalculator } from "@/components/home/mortgage-calculator";
import { Testimonials } from "@/components/home/testimonials";
import { TopLocations } from "@/components/home/top-locations";
import {
  bnbProperties,
  featuredProperties,
  latestProperties,
  mockBlogPosts,
  mockCategories,
  mockLocations,
  mockTestimonials,
  rentalProperties,
} from "@/data/mock";
import { getFeaturedAgentsForHome } from "@/lib/featured-agents";

export default async function HomePage() {
  const featuredAgents = await getFeaturedAgentsForHome(4);

  return (
    <>
      <AnimatedHero />

      <div className="gradient-mesh">
        <FeaturedProperties properties={featuredProperties} />
        <FeaturedProperties
          properties={rentalProperties.slice(0, 8)}
          title="Houses & apartments for rent"
          subtitle="Monthly rentals across Nairobi, Kisumu, Mombasa and beyond"
          viewAllHref="/rent"
          viewAllLabel="Browse all rentals"
        />
        <FeaturedProperties
          properties={bnbProperties.slice(0, 8)}
          title="BnB & holiday stays"
          subtitle="Beach villas, city Airbnbs, lake cottages — priced per night"
          viewAllHref="/bnb"
          viewAllLabel="Browse all BnBs"
        />
        <Categories categories={mockCategories} />
        <LatestProperties properties={latestProperties} />
        <TopLocations locations={mockLocations} />
        <FeaturedAgents agents={featuredAgents} />
        <MortgageCalculator />
        <Testimonials testimonials={mockTestimonials} />
        <LatestBlog posts={mockBlogPosts} />
        <CtaSection />
      </div>
    </>
  );
}
