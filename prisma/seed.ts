import { PrismaClient, Role, ListingType, PropertyType, PropertyStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding NyumbaHub Kenya...");

  await prisma.comparisonItem.deleteMany();
  await prisma.propertyComparison.deleteMany();
  await prisma.priceAlert.deleteMany();
  await prisma.advertisement.deleteMany();
  await prisma.viewing.deleteMany();
  await prisma.nearbyPlace.deleteMany();
  await prisma.priceHistory.deleteMany();
  await prisma.savedSearch.deleteMany();
  await prisma.recentlyViewed.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.propertyVideo.deleteMany();
  await prisma.propertyImage.deleteMany();
  await prisma.property.deleteMany();
  await prisma.client.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.amenity.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("Password123!", 12);

  const admin = await prisma.user.create({
    data: {
      name: "NyumbaHub Admin",
      email: "admin@nyumbahub.co.ke",
      phone: "+254700000001",
      passwordHash,
      role: Role.ADMIN,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      verificationStatus: "VERIFIED",
      nationalIdVerified: "VERIFIED",
    },
  });

  const seller = await prisma.user.create({
    data: {
      name: "Grace Wanjiku",
      email: "seller@nyumbahub.co.ke",
      phone: "+254712345678",
      passwordHash,
      role: Role.SELLER,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      verificationStatus: "VERIFIED",
      bio: "Property owner with homes across Nairobi and Kiambu.",
    },
  });

  const agentUser = await prisma.user.create({
    data: {
      name: "David Ochieng",
      email: "agent@nyumbahub.co.ke",
      phone: "+254722334455",
      passwordHash,
      role: Role.AGENT,
      emailVerified: new Date(),
      phoneVerified: new Date(),
      verificationStatus: "VERIFIED",
      bio: "Licensed estate agent specializing in Kilimani and Westlands.",
    },
  });

  const buyer = await prisma.user.create({
    data: {
      name: "Amina Hassan",
      email: "buyer@nyumbahub.co.ke",
      phone: "+254733445566",
      passwordHash,
      role: Role.BUYER,
      emailVerified: new Date(),
    },
  });

  const agent = await prisma.agent.create({
    data: {
      userId: agentUser.id,
      agencyName: "Horizon Estates Kenya",
      licenseNumber: "REB-KE-2024-1182",
      specialty: "Residential & Investment",
      yearsExperience: 8,
      rating: 4.8,
      reviewCount: 56,
      totalSales: 120,
      bio: "Helping Kenyan families find homes in Nairobi’s prime suburbs.",
      county: "Nairobi",
      town: "Westlands",
      isFeatured: true,
      isVerified: true,
      verificationStatus: "VERIFIED",
    },
  });

  const amenities = await Promise.all(
    [
      { name: "Parking", icon: "car", category: "Outdoor" },
      { name: "Swimming Pool", icon: "waves", category: "Outdoor" },
      { name: "24/7 Security", icon: "shield", category: "Safety" },
      { name: "Backup Generator", icon: "zap", category: "Utilities" },
      { name: "Fibre Internet", icon: "wifi", category: "Utilities" },
      { name: "Gym", icon: "dumbbell", category: "Lifestyle" },
      { name: "Borehole", icon: "droplets", category: "Utilities" },
      { name: "Garden", icon: "trees", category: "Outdoor" },
      { name: "Furnished", icon: "sofa", category: "Interior" },
      { name: "CCTV", icon: "camera", category: "Safety" },
    ].map((a) => prisma.amenity.create({ data: a })),
  );

  const properties = [
    {
      title: "Modern 3BR Apartment in Kilimani",
      slug: "modern-3br-apartment-kilimani",
      description:
        "Bright, contemporary apartment in the heart of Kilimani with open-plan living, fitted kitchen, and balcony views. Walking distance to Yaya Centre and top schools.",
      listingType: ListingType.BUY,
      propertyType: PropertyType.APARTMENT,
      price: 18500000,
      bedrooms: 3,
      bathrooms: 2,
      parkingSpaces: 2,
      floorArea: 145,
      county: "Nairobi",
      town: "Kilimani",
      estate: "State House Crescent",
      latitude: -1.2921,
      longitude: 36.785,
      swimmingPool: true,
      security: true,
      furnished: false,
      isFeatured: true,
      isVerified: true,
      isPremium: true,
      image:
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
    },
    {
      title: "Spacious Family House in Runda",
      slug: "spacious-family-house-runda",
      description:
        "Elegant 5-bedroom family home on a leafy Runda plot with manicured gardens, staff quarters, and double garage. Ideal for diplomatic and executive living.",
      listingType: ListingType.BUY,
      propertyType: PropertyType.HOUSE,
      price: 85000000,
      bedrooms: 5,
      bathrooms: 4,
      parkingSpaces: 4,
      floorArea: 420,
      plotSize: 0.5,
      county: "Nairobi",
      town: "Runda",
      estate: "Runda Mimosa",
      latitude: -1.2167,
      longitude: 36.8167,
      swimmingPool: true,
      security: true,
      isFeatured: true,
      isVerified: true,
      image:
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
    },
    {
      title: "2BR Apartment to Let – Westlands",
      slug: "2br-apartment-rent-westlands",
      description:
        "Fully furnished 2-bedroom apartment near Sarit Centre with gym access, backup power, and secure parking. Perfect for young professionals.",
      listingType: ListingType.RENT,
      propertyType: PropertyType.APARTMENT,
      price: 95000,
      bedrooms: 2,
      bathrooms: 2,
      parkingSpaces: 1,
      floorArea: 95,
      county: "Nairobi",
      town: "Westlands",
      estate: "Mpaka Road",
      latitude: -1.267,
      longitude: 36.811,
      furnished: true,
      security: true,
      isFeatured: true,
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
    },
    {
      title: "Beachfront Villa in Diani",
      slug: "beachfront-villa-diani",
      description:
        "Stunning holiday villa steps from Diani Beach with private pool, ocean views, and outdoor lounge. Ideal for short stays and Airbnb-style hosting.",
      listingType: ListingType.HOLIDAY,
      propertyType: PropertyType.VILLA,
      price: 25000,
      bedrooms: 4,
      bathrooms: 4,
      parkingSpaces: 3,
      floorArea: 280,
      county: "Kwale",
      town: "Diani",
      estate: "Beach Road",
      latitude: -4.28,
      longitude: 39.59,
      swimmingPool: true,
      furnished: true,
      security: true,
      isSponsored: true,
      image:
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80",
    },
    {
      title: "1/8 Acre Plot in Kitengela",
      slug: "eighth-acre-plot-kitengela",
      description:
        "Ready title deed plot in a gated Kitengela estate with graded roads, electricity, and borehole water. Great for self-build or investment.",
      listingType: ListingType.LAND,
      propertyType: PropertyType.PLOT,
      price: 3200000,
      plotSize: 0.125,
      county: "Kajiado",
      town: "Kitengela",
      estate: "Green Valley",
      latitude: -1.477,
      longitude: 36.962,
      security: true,
      isVerified: true,
      image:
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
    },
    {
      title: "Commercial Office Space – Upper Hill",
      slug: "commercial-office-upper-hill",
      description:
        "Grade-A office floor in Upper Hill with lift access, fibre, backup generator, and ample parking. Suitable for NGOs and corporate HQs.",
      listingType: ListingType.COMMERCIAL,
      propertyType: PropertyType.OFFICE,
      price: 450000,
      parkingSpaces: 10,
      floorArea: 350,
      county: "Nairobi",
      town: "Upper Hill",
      estate: "Hospital Road",
      latitude: -1.299,
      longitude: 36.812,
      security: true,
      isPremium: true,
      image:
        "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    },
  ];

  for (const [index, p] of properties.entries()) {
    const { image, ...rest } = p;
    const property = await prisma.property.create({
      data: {
        ...rest,
        status: PropertyStatus.ACTIVE,
        publishedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        ownerId: seller.id,
        agentId: agent.id,
        currency: "KES",
        views: 50 + index * 37,
        images: {
          create: [
            {
              url: image,
              alt: rest.title,
              order: 0,
              isPrimary: true,
            },
            {
              url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
              alt: `${rest.title} interior`,
              order: 1,
            },
          ],
        },
        amenities: {
          create: amenities.slice(0, 5).map((a) => ({ amenityId: a.id })),
        },
        nearbyPlaces: {
          create: [
            { name: "International School", type: "school", distance: 1.2 },
            { name: "Aga Khan Hospital", type: "hospital", distance: 2.5 },
            { name: "Shopping Mall", type: "shopping", distance: 0.8 },
          ],
        },
        priceHistory: {
          create: [
            { price: rest.price * 1.05, recordedAt: new Date(Date.now() - 180 * 86400000) },
            { price: rest.price, recordedAt: new Date() },
          ],
        },
      },
    });

    await prisma.lead.create({
      data: {
        propertyId: property.id,
        buyerId: buyer.id,
        agentId: agentUser.id,
        name: buyer.name!,
        email: buyer.email,
        phone: buyer.phone,
        message: "I am interested in viewing this property this weekend.",
        status: "NEW",
        source: "website",
      },
    });
  }

  await prisma.blogPost.createMany({
    data: [
      {
        title: "First-Time Buyer’s Guide to Nairobi in 2026",
        slug: "first-time-buyers-guide-nairobi-2026",
        excerpt: "From deposits to title deeds — what every Kenyan first-time buyer should know.",
        content:
          "## Getting started\n\nBuying your first home in Nairobi requires planning. Start with a clear budget, get pre-approved for a mortgage, and verify title deeds through a conveyancing advocate.\n\n## Popular suburbs\n\nKilimani, Syokimau, Ruiru, and Kitengela remain strong for value-conscious buyers.",
        category: "Buying Guide",
        tags: ["buying", "nairobi", "mortgage"],
        published: true,
        publishedAt: new Date(),
        authorId: admin.id,
        coverImage:
          "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
      },
      {
        title: "Why Kitengela Land Remains a Smart Investment",
        slug: "kitengela-land-investment-2026",
        excerpt: "Infrastructure growth and affordable plots continue to attract investors.",
        content:
          "## Market overview\n\nKitengela benefits from the Standard Gauge Railway corridor and expanding residential demand from Nairobi workers.",
        category: "Investment Advice",
        tags: ["land", "investment", "kajiado"],
        published: true,
        publishedAt: new Date(),
        authorId: admin.id,
        coverImage:
          "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
      },
      {
        title: "How to Price Your Rental in Westlands",
        slug: "price-rental-westlands",
        excerpt: "Comparable rents, amenities, and seasonality tips for landlords.",
        content:
          "## Pricing factors\n\nProximity to Sarit and Westgate, furnish level, and backup utilities drive Westlands rents.",
        category: "Selling Guide",
        tags: ["rent", "westlands", "pricing"],
        published: true,
        publishedAt: new Date(),
        authorId: agentUser.id,
        coverImage:
          "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      },
    ],
  });

  await prisma.subscription.create({
    data: {
      userId: agentUser.id,
      plan: "AGENT_PRO",
      status: "ACTIVE",
      amount: 4999,
      endDate: new Date(Date.now() + 30 * 86400000),
    },
  });

  await prisma.advertisement.create({
    data: {
      title: "List your property free this month",
      imageUrl:
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80",
      linkUrl: "/dashboard/seller/properties/new",
      placement: "HOME_BANNER",
      isActive: true,
      advertiserId: admin.id,
    },
  });

  console.log("✅ Seed complete");
  console.log("Accounts (password: Password123!):");
  console.log("  admin@nyumbahub.co.ke");
  console.log("  seller@nyumbahub.co.ke");
  console.log("  agent@nyumbahub.co.ke");
  console.log("  buyer@nyumbahub.co.ke");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
