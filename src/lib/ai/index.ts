import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

export interface PropertyDescriptionInput {
  title: string;
  propertyType: string;
  listingType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  county: string;
  town: string;
  estate?: string | null;
  price: number;
  amenities?: {
    parking?: boolean;
    swimmingPool?: boolean;
    furnished?: boolean;
    security?: boolean;
  };
  highlights?: string[];
}

export interface PriceSuggestionInput {
  propertyType: string;
  listingType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  county: string;
  town: string;
  floorArea?: number | null;
  plotSize?: number | null;
  furnished?: boolean;
  swimmingPool?: boolean;
}

export interface PriceSuggestion {
  suggestedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: "low" | "medium" | "high";
  rationale: string;
}

export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  score: number;
  matches: Array<{
    id: string;
    title: string;
    slug: string;
    score: number;
  }>;
}

export interface RecommendationResult {
  propertyId: string;
  recommendations: Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    county: string;
    town: string;
    score: number;
  }>;
}

function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

async function callOpenAi(
  systemPrompt: string,
  userPrompt: string,
): Promise<string | null> {
  if (!isOpenAiConfigured()) {
    return null;
  }

  const model = process.env.AI_MODEL?.trim() || "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY!.trim();

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

function buildAmenitySentence(
  amenities: PropertyDescriptionInput["amenities"],
): string {
  const features: string[] = [];

  if (amenities?.parking) features.push("secure parking");
  if (amenities?.swimmingPool) features.push("a swimming pool");
  if (amenities?.furnished) features.push("fully furnished interiors");
  if (amenities?.security) features.push("24/7 security");

  if (features.length === 0) {
    return "The property offers practical living in a well-connected neighbourhood.";
  }

  return `Key features include ${features.join(", ")}.`;
}

function templatePropertyDescription(input: PropertyDescriptionInput): string {
  const location = [input.estate, input.town, input.county]
    .filter(Boolean)
    .join(", ");
  const beds =
    input.bedrooms != null ? `${input.bedrooms}-bedroom` : "spacious";
  const baths =
    input.bathrooms != null ? `${input.bathrooms} bathroom(s)` : "modern bathrooms";

  return [
    `Discover this ${beds} ${input.propertyType.toLowerCase().replace(/_/g, " ")} for ${input.listingType.toLowerCase()} in ${location}.`,
    `Listed at ${formatPrice(input.price)}, this home combines comfort with convenience for buyers and tenants across Kenya.`,
    `The layout includes ${baths}, with thoughtful finishes suited to everyday living.`,
    buildAmenitySentence(input.amenities),
    input.highlights?.length
      ? `Highlights: ${input.highlights.join("; ")}.`
      : "Contact Your Home to schedule a viewing today.",
  ].join("\n\n");
}

function templatePriceSuggestion(input: PriceSuggestionInput): PriceSuggestion {
  const baseRates: Record<string, number> = {
    APARTMENT: 8_500_000,
    HOUSE: 15_000_000,
    TOWNHOUSE: 12_000_000,
    VILLA: 35_000_000,
    STUDIO: 4_500_000,
    BUNGALOW: 10_000_000,
    MAISONETTE: 9_000_000,
    PENTHOUSE: 28_000_000,
    OFFICE: 18_000_000,
    SHOP: 7_500_000,
    WAREHOUSE: 22_000_000,
    PLOT: 3_500_000,
    FARM: 6_000_000,
    OTHER: 8_000_000,
  };

  let base = baseRates[input.propertyType] ?? 8_000_000;

  if (input.listingType === "RENT") {
    base = Math.round(base / 300);
  } else if (input.listingType === "LAND") {
    base = baseRates.PLOT;
  }

  const metroMultiplier = ["Nairobi", "Mombasa", "Kiambu"].includes(input.county)
    ? 1.25
    : input.county === "Nakuru"
      ? 1.05
      : 0.9;

  const bedroomMultiplier = 1 + (input.bedrooms ?? 2) * 0.08;
  const areaMultiplier = input.floorArea
    ? 1 + Math.min(input.floorArea / 500, 0.4)
    : 1;

  const amenityMultiplier =
    (input.furnished ? 1.08 : 1) * (input.swimmingPool ? 1.12 : 1);

  const suggestedPrice = Math.round(
    base * metroMultiplier * bedroomMultiplier * areaMultiplier * amenityMultiplier,
  );

  return {
    suggestedPrice,
    minPrice: Math.round(suggestedPrice * 0.85),
    maxPrice: Math.round(suggestedPrice * 1.15),
    confidence: "medium",
    rationale: `Estimate based on ${input.propertyType.toLowerCase()} listings in ${input.town}, ${input.county}, adjusted for size and amenities.`,
  };
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) {
    return 0;
  }

  let intersection = 0;

  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export async function generatePropertyDescription(
  input: PropertyDescriptionInput,
): Promise<string> {
  const aiResult = await callOpenAi(
    "You write concise, professional real estate listing descriptions for the Kenyan market. Use Kenyan English, mention location naturally, and avoid hype.",
    JSON.stringify(input),
  );

  return aiResult ?? templatePropertyDescription(input);
}

export async function suggestPrice(
  input: PriceSuggestionInput,
): Promise<PriceSuggestion> {
  const aiResult = await callOpenAi(
    "You suggest property prices in KES for Kenya. Respond with JSON: { suggestedPrice, minPrice, maxPrice, confidence, rationale }.",
    JSON.stringify(input),
  );

  if (aiResult) {
    try {
      const parsed = JSON.parse(aiResult) as PriceSuggestion;
      if (
        typeof parsed.suggestedPrice === "number" &&
        typeof parsed.minPrice === "number" &&
        typeof parsed.maxPrice === "number"
      ) {
        return parsed;
      }
    } catch {
      // fall through to template
    }
  }

  return templatePriceSuggestion(input);
}

export async function detectDuplicateListing(
  title: string,
  description: string,
  excludePropertyId?: string,
): Promise<DuplicateDetectionResult> {
  const sourceTokens = tokenize(`${title} ${description}`);

  const candidates = await prisma.property.findMany({
    where: {
      status: { in: ["ACTIVE", "PENDING", "DRAFT"] },
      ...(excludePropertyId ? { id: { not: excludePropertyId } } : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
    },
    take: 100,
    orderBy: { updatedAt: "desc" },
  });

  const matches = candidates
    .map((property: (typeof candidates)[number]) => {
      const score = jaccardSimilarity(
        sourceTokens,
        tokenize(`${property.title} ${property.description}`),
      );

      return {
        id: property.id,
        title: property.title,
        slug: property.slug,
        score,
      };
    })
    .filter((match: { score: number }) => match.score >= 0.45)
    .sort(
      (
        a: { score: number },
        b: { score: number },
      ) => b.score - a.score,
    )
    .slice(0, 5);

  const topScore = matches[0]?.score ?? 0;

  return {
    isDuplicate: topScore >= 0.72,
    score: topScore,
    matches,
  };
}

export async function getRecommendations(
  propertyId: string,
  limit = 6,
): Promise<RecommendationResult> {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      listingType: true,
      propertyType: true,
      county: true,
      town: true,
      price: true,
      bedrooms: true,
    },
  });

  if (!property) {
    return { propertyId, recommendations: [] };
  }

  const priceMin = property.price * 0.75;
  const priceMax = property.price * 1.25;

  const similar = await prisma.property.findMany({
    where: {
      id: { not: propertyId },
      status: "ACTIVE",
      listingType: property.listingType,
      county: property.county,
      price: { gte: priceMin, lte: priceMax },
      ...(property.bedrooms != null
        ? { bedrooms: { gte: Math.max(property.bedrooms - 1, 0) } }
        : {}),
    },
    select: {
      id: true,
      title: true,
      slug: true,
      price: true,
      county: true,
      town: true,
      propertyType: true,
      bedrooms: true,
    },
    take: limit * 2,
    orderBy: [{ isFeatured: "desc" }, { views: "desc" }],
  });

  const recommendations = similar
    .map((candidate: (typeof similar)[number]) => {
      let score = 0.5;

      if (candidate.town === property.town) score += 0.2;
      if (candidate.propertyType === property.propertyType) score += 0.15;
      if (
        property.bedrooms != null &&
        candidate.bedrooms === property.bedrooms
      ) {
        score += 0.1;
      }

      const priceDiff = Math.abs(candidate.price - property.price) / property.price;
      score += Math.max(0, 0.15 - priceDiff);

      return {
        id: candidate.id,
        title: candidate.title,
        slug: candidate.slug,
        price: candidate.price,
        county: candidate.county,
        town: candidate.town,
        score: Number(score.toFixed(2)),
      };
    })
    .sort(
      (
        a: { score: number },
        b: { score: number },
      ) => b.score - a.score,
    )
    .slice(0, limit);

  return { propertyId, recommendations };
}
