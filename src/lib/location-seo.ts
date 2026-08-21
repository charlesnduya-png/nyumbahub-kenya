import {
  placeLocationLabel,
  propertyForSalePath,
  type PropertyForSalePlace,
} from "@/lib/property-for-sale";

export type LocationMarketIntent = "sale" | "rent" | "bnb";

export function intentHubPath(intent: LocationMarketIntent) {
  if (intent === "rent") return "/rent";
  if (intent === "bnb") return "/bnb";
  return "/property-for-sale";
}

export function intentPlacePath(
  intent: LocationMarketIntent,
  slug: string,
) {
  if (intent === "rent") return `/rent/${slug}`;
  if (intent === "bnb") return `/bnb/${slug}`;
  return propertyForSalePath(slug);
}

export function intentHeading(intent: LocationMarketIntent, place: PropertyForSalePlace) {
  if (intent === "rent") return `Houses & apartments for rent in ${place.name}`;
  if (intent === "bnb") return `BnB & holiday homes in ${place.name}`;
  return `Property for sale in ${place.name}`;
}

export function intentTitle(intent: LocationMarketIntent, place: PropertyForSalePlace) {
  const area = placeLocationLabel(place);
  if (intent === "rent") {
    return `Houses & Apartments for Rent in ${area}`;
  }
  if (intent === "bnb") {
    return `BnB, Airbnb & Holiday Homes in ${area}`;
  }
  return `Property for Sale in ${area}`;
}

export function intentDescription(
  intent: LocationMarketIntent,
  place: PropertyForSalePlace,
) {
  const area = placeLocationLabel(place);
  if (intent === "rent") {
    return `Find verified apartments, bedsitters, maisonettes, and family houses for rent in ${area}. Compare prices, photos, and contact landlords on Your Home — Africa's rental marketplace.`;
  }
  if (intent === "bnb") {
    return `Book BnB stays, Airbnb-style apartments, beach villas, and short-stay homes in ${area}. Nightly holiday rentals on Your Home (yourhome.co.ke).`;
  }
  return `Find verified houses, apartments, and land for sale in ${area}. Compare prices, view photos, and contact sellers on Your Home — Africa real estate.`;
}

export function intentKeywords(
  intent: LocationMarketIntent,
  place: PropertyForSalePlace,
): string[] {
  const extra =
    intent === "rent"
      ? [
          `houses for rent ${place.name}`,
          `apartments for rent ${place.name}`,
          `${place.name} rentals`,
          `best rentals ${place.country}`,
        ]
      : intent === "bnb"
        ? [
            `BnB ${place.name}`,
            `Airbnb ${place.name}`,
            `holiday homes ${place.name}`,
            `short stay ${place.name}`,
            `best BnB ${place.country}`,
          ]
        : [
            `property for sale ${place.name}`,
            `houses for sale ${place.name}`,
            `land for sale ${place.name}`,
            `best real estate ${place.country}`,
          ];
  return [
    ...extra,
    `${place.name} ${place.country} real estate`,
    `${place.country} property`,
    "Africa real estate",
    "yourhome.co.ke",
  ];
}

export function intentFaqs(
  intent: LocationMarketIntent,
  place: PropertyForSalePlace,
) {
  const where = placeLocationLabel(place);
  if (intent === "rent") {
    return [
      {
        question: `Can I rent an apartment in ${place.name}?`,
        answer: `Yes. Your Home lists verified houses and apartments for rent in ${where}. Filter by bedrooms and price, then contact the landlord or agent from the listing.`,
      },
      {
        question: `Are ${place.name} rentals verified?`,
        answer: `Listings go live after admin review. Always inspect the home, confirm the lease, and never send a deposit off-platform until you have viewed the property.`,
      },
      {
        question: `Does Your Home cover rentals across Africa?`,
        answer: `Yes. Search monthly rentals in ${place.country} and other African countries, plus Kenya counties, on yourhome.co.ke.`,
      },
    ];
  }
  if (intent === "bnb") {
    return [
      {
        question: `Are there BnB and Airbnb stays in ${place.name}?`,
        answer: `Yes. Browse short-stay apartments, villas, and holiday homes in ${where}. Prices are per night; hosts approve each booking from their dashboard.`,
      },
      {
        question: `How do I book a stay in ${place.name}?`,
        answer: `Open a guest account, pick dates on the listing, and send a booking request. The host confirms availability. Your Home is the marketplace, not the hotel.`,
      },
      {
        question: `Can I host a BnB in ${place.country}?`,
        answer: `Yes. Register as a professional, list your holiday home, and go live after admin approval. Guests across Africa can find your stay on Your Home.`,
      },
    ];
  }
  return [
    {
      question: `Are there houses for sale in ${place.name}?`,
      answer: `Yes. Your Home lists verified houses, apartments, and land for sale in ${where}. New listings go live after admin review.`,
    },
    {
      question: `How do I buy property in ${place.name}?`,
      answer: `${place.buyingGuide} After you shortlist, contact the seller, book a viewing, and complete a title search before you pay.`,
    },
    {
      question: `Is land for sale in ${place.name}?`,
      answer: `Plots and land in ${where} appear alongside homes. Confirm beacons, access, and title on the ground.`,
    },
  ];
}

export function listingTypeForIntent(intent: LocationMarketIntent) {
  if (intent === "rent") return ["RENT"] as const;
  if (intent === "bnb") return ["HOLIDAY"] as const;
  return ["BUY", "LAND"] as const;
}

export function propertiesSearchHref(
  intent: LocationMarketIntent,
  place: PropertyForSalePlace,
) {
  const params = new URLSearchParams();
  if (intent === "rent") params.set("listingType", "RENT");
  else if (intent === "bnb") params.set("listingType", "HOLIDAY");
  else params.set("listingType", "BUY");

  if (place.kind === "country") {
    params.set("country", place.country);
  } else if (place.kind === "city") {
    params.set("country", place.country);
    params.set("town", place.name);
  } else if (place.kind === "town") {
    params.set("town", place.name);
    params.set("county", String(place.county));
  } else {
    params.set("county", String(place.county));
  }
  return `/properties?${params.toString()}`;
}
