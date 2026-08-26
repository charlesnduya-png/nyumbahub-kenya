import { AFRICAN_COUNTRIES } from "@/lib/african-countries";
import { slugify } from "@/lib/utils";

export const AFRICA_REGIONS = [
  "East Africa",
  "West Africa",
  "North Africa",
  "Southern Africa",
  "Central Africa",
] as const;

export type AfricaRegion = (typeof AFRICA_REGIONS)[number];

export type AfricaCitySeed = {
  name: string;
  /** Set when the default slug would clash with a Kenya county/town page. */
  slug?: string;
};

export type AfricaCountryMarket = {
  name: string;
  slug: string;
  iso2: string;
  region: AfricaRegion;
  cities: AfricaCitySeed[];
};

/**
 * High-intent African property markets. Capitals plus commercial, coastal,
 * and tourism cities people search for houses, rentals, land, and BnB stays.
 */
const COUNTRY_MARKETS: Record<
  string,
  { region: AfricaRegion; cities: AfricaCitySeed[] }
> = {
  Kenya: {
    region: "East Africa",
    cities: [],
  },
  Uganda: {
    region: "East Africa",
    cities: [
      { name: "Kampala" },
      { name: "Entebbe" },
      { name: "Jinja" },
      { name: "Mbarara" },
      { name: "Gulu" },
    ],
  },
  Tanzania: {
    region: "East Africa",
    cities: [
      { name: "Dar es Salaam" },
      { name: "Arusha" },
      { name: "Zanzibar" },
      { name: "Dodoma" },
      { name: "Mwanza" },
      { name: "Moshi" },
    ],
  },
  Rwanda: {
    region: "East Africa",
    cities: [{ name: "Kigali" }, { name: "Musanze" }, { name: "Huye" }],
  },
  Ethiopia: {
    region: "East Africa",
    cities: [
      { name: "Addis Ababa" },
      { name: "Dire Dawa" },
      { name: "Hawassa" },
    ],
  },
  Somalia: {
    region: "East Africa",
    cities: [{ name: "Mogadishu" }, { name: "Hargeisa" }, { name: "Bosaso" }],
  },
  "South Sudan": {
    region: "East Africa",
    cities: [{ name: "Juba" }, { name: "Wau" }],
  },
  Burundi: {
    region: "East Africa",
    cities: [{ name: "Bujumbura" }, { name: "Gitega" }],
  },
  Djibouti: {
    region: "East Africa",
    cities: [{ name: "Djibouti City", slug: "djibouti-city" }],
  },
  Eritrea: {
    region: "East Africa",
    cities: [{ name: "Asmara" }, { name: "Massawa" }],
  },
  Seychelles: {
    region: "East Africa",
    cities: [{ name: "Victoria", slug: "victoria-seychelles" }, { name: "Beau Vallon" }],
  },
  Madagascar: {
    region: "East Africa",
    cities: [
      { name: "Antananarivo" },
      { name: "Toamasina" },
      { name: "Nosy Be" },
    ],
  },
  Mauritius: {
    region: "East Africa",
    cities: [
      { name: "Port Louis" },
      { name: "Grand Baie" },
      { name: "Flic en Flac" },
    ],
  },
  Comoros: {
    region: "East Africa",
    cities: [{ name: "Moroni" }],
  },
  Malawi: {
    region: "East Africa",
    cities: [{ name: "Lilongwe" }, { name: "Blantyre" }, { name: "Mzuzu" }],
  },
  Mozambique: {
    region: "East Africa",
    cities: [
      { name: "Maputo" },
      { name: "Beira" },
      { name: "Nampula" },
      { name: "Pemba" },
    ],
  },
  Zambia: {
    region: "East Africa",
    cities: [
      { name: "Lusaka" },
      { name: "Livingstone" },
      { name: "Ndola" },
      { name: "Kitwe" },
    ],
  },
  Zimbabwe: {
    region: "East Africa",
    cities: [
      { name: "Harare" },
      { name: "Bulawayo" },
      { name: "Victoria Falls" },
      { name: "Mutare" },
    ],
  },
  Nigeria: {
    region: "West Africa",
    cities: [
      { name: "Lagos" },
      { name: "Abuja" },
      { name: "Port Harcourt" },
      { name: "Ibadan" },
      { name: "Kano" },
      { name: "Enugu" },
      { name: "Benin City" },
      { name: "Abeokuta" },
    ],
  },
  Ghana: {
    region: "West Africa",
    cities: [
      { name: "Accra" },
      { name: "Kumasi" },
      { name: "Takoradi" },
      { name: "Tamale" },
      { name: "Cape Coast" },
    ],
  },
  Senegal: {
    region: "West Africa",
    cities: [{ name: "Dakar" }, { name: "Thiès" }, { name: "Saint-Louis" }],
  },
  "Côte d'Ivoire": {
    region: "West Africa",
    cities: [
      { name: "Abidjan" },
      { name: "Yamoussoukro" },
      { name: "San-Pédro" },
    ],
  },
  Cameroon: {
    region: "West Africa",
    cities: [
      { name: "Douala" },
      { name: "Yaoundé" },
      { name: "Bamenda" },
      { name: "Limbe" },
    ],
  },
  Mali: {
    region: "West Africa",
    cities: [{ name: "Bamako" }, { name: "Sikasso" }],
  },
  "Burkina Faso": {
    region: "West Africa",
    cities: [{ name: "Ouagadougou" }, { name: "Bobo-Dioulasso" }],
  },
  Benin: {
    region: "West Africa",
    cities: [{ name: "Cotonou" }, { name: "Porto-Novo" }],
  },
  Togo: {
    region: "West Africa",
    cities: [{ name: "Lomé" }],
  },
  Guinea: {
    region: "West Africa",
    cities: [{ name: "Conakry" }],
  },
  "Sierra Leone": {
    region: "West Africa",
    cities: [{ name: "Freetown" }],
  },
  Liberia: {
    region: "West Africa",
    cities: [{ name: "Monrovia" }],
  },
  Gambia: {
    region: "West Africa",
    cities: [{ name: "Banjul" }, { name: "Serekunda" }],
  },
  Niger: {
    region: "West Africa",
    cities: [{ name: "Niamey" }],
  },
  "Cabo Verde": {
    region: "West Africa",
    cities: [{ name: "Praia" }, { name: "Mindelo" }],
  },
  "Guinea-Bissau": {
    region: "West Africa",
    cities: [{ name: "Bissau" }],
  },
  Mauritania: {
    region: "West Africa",
    cities: [{ name: "Nouakchott" }, { name: "Nouadhibou" }],
  },
  Egypt: {
    region: "North Africa",
    cities: [
      { name: "Cairo" },
      { name: "Alexandria" },
      { name: "Giza" },
      { name: "Hurghada" },
      { name: "Sharm El Sheikh" },
      { name: "Luxor" },
    ],
  },
  Morocco: {
    region: "North Africa",
    cities: [
      { name: "Casablanca" },
      { name: "Marrakech" },
      { name: "Rabat" },
      { name: "Tangier" },
      { name: "Agadir" },
      { name: "Fes" },
    ],
  },
  Tunisia: {
    region: "North Africa",
    cities: [
      { name: "Tunis" },
      { name: "Sousse" },
      { name: "Djerba" },
      { name: "Hammamet" },
    ],
  },
  Algeria: {
    region: "North Africa",
    cities: [{ name: "Algiers" }, { name: "Oran" }, { name: "Constantine" }],
  },
  Libya: {
    region: "North Africa",
    cities: [{ name: "Tripoli" }, { name: "Benghazi" }],
  },
  Sudan: {
    region: "North Africa",
    cities: [{ name: "Khartoum" }, { name: "Port Sudan" }],
  },
  "South Africa": {
    region: "Southern Africa",
    cities: [
      { name: "Johannesburg" },
      { name: "Cape Town" },
      { name: "Durban" },
      { name: "Pretoria" },
      { name: "Sandton" },
      { name: "Stellenbosch" },
      { name: "Gqeberha" },
      { name: "Bloemfontein" },
    ],
  },
  Namibia: {
    region: "Southern Africa",
    cities: [
      { name: "Windhoek" },
      { name: "Swakopmund" },
      { name: "Walvis Bay" },
    ],
  },
  Botswana: {
    region: "Southern Africa",
    cities: [{ name: "Gaborone" }, { name: "Maun" }, { name: "Francistown" }],
  },
  Angola: {
    region: "Southern Africa",
    cities: [{ name: "Luanda" }, { name: "Benguela" }],
  },
  Eswatini: {
    region: "Southern Africa",
    cities: [{ name: "Mbabane" }, { name: "Manzini" }],
  },
  Lesotho: {
    region: "Southern Africa",
    cities: [{ name: "Maseru" }],
  },
  "Democratic Republic of the Congo": {
    region: "Central Africa",
    cities: [
      { name: "Kinshasa" },
      { name: "Lubumbashi" },
      { name: "Goma" },
      { name: "Kisangani" },
    ],
  },
  Congo: {
    region: "Central Africa",
    cities: [{ name: "Brazzaville" }, { name: "Pointe-Noire" }],
  },
  Gabon: {
    region: "Central Africa",
    cities: [{ name: "Libreville" }, { name: "Port-Gentil" }],
  },
  "Equatorial Guinea": {
    region: "Central Africa",
    cities: [{ name: "Malabo" }, { name: "Bata" }],
  },
  Chad: {
    region: "Central Africa",
    cities: [{ name: "N'Djamena" }],
  },
  "Central African Republic": {
    region: "Central Africa",
    cities: [{ name: "Bangui" }],
  },
  "São Tomé and Príncipe": {
    region: "Central Africa",
    cities: [{ name: "São Tomé" }],
  },
};

const REGION_HOOK: Record<AfricaRegion, string> = {
  "East Africa":
    "East Africa’s growth corridor — from Nairobi and Kampala to Dar es Salaam, Kigali, and Addis Ababa",
  "West Africa":
    "West Africa’s commercial belt — Lagos, Accra, Abidjan, Dakar, and the Gulf of Guinea coast",
  "North Africa":
    "North Africa’s Mediterranean and Nile markets — Cairo, Casablanca, Marrakech, Tunis, and Algiers",
  "Southern Africa":
    "Southern Africa’s property hubs — Johannesburg, Cape Town, Durban, Windhoek, and Gaborone",
  "Central Africa":
    "Central Africa’s capital and trade cities — Kinshasa, Brazzaville, Libreville, and Douala",
};

function countrySlug(name: string) {
  return slugify(name);
}

export function citySlug(city: AfricaCitySeed) {
  return city.slug ?? slugify(city.name);
}

export const AFRICA_COUNTRY_MARKETS: AfricaCountryMarket[] =
  AFRICAN_COUNTRIES.map((country) => {
    const seed = COUNTRY_MARKETS[country.name] ?? {
      region: "East Africa" as const,
      cities: [],
    };
    return {
      name: country.name,
      slug: countrySlug(country.name),
      iso2: country.iso2,
      region: seed.region,
      cities: seed.cities,
    };
  });

export const AFRICA_COUNTRY_MARKETS_BY_SLUG = new Map(
  AFRICA_COUNTRY_MARKETS.map((country) => [country.slug, country]),
);

export const AFRICA_COUNTRY_MARKETS_BY_NAME = new Map(
  AFRICA_COUNTRY_MARKETS.map((country) => [country.name, country]),
);

export function citiesForCountry(countryName: string): string[] {
  return (
    AFRICA_COUNTRY_MARKETS_BY_NAME.get(countryName)?.cities.map(
      (city) => city.name,
    ) ?? []
  );
}

export type AfricaCityMarket = {
  name: string;
  slug: string;
  country: string;
  countrySlug: string;
  region: AfricaRegion;
};

export const AFRICA_CITY_MARKETS: AfricaCityMarket[] =
  AFRICA_COUNTRY_MARKETS.flatMap((country) =>
    country.cities.map((city) => ({
      name: city.name,
      slug: citySlug(city),
      country: country.name,
      countrySlug: country.slug,
      region: country.region,
    })),
  );

export const AFRICA_CITY_MARKETS_BY_SLUG = new Map(
  AFRICA_CITY_MARKETS.map((city) => [city.slug, city]),
);

export function getAfricaMarketsByRegion() {
  return AFRICA_REGIONS.map((region) => ({
    region,
    countries: AFRICA_COUNTRY_MARKETS.filter(
      (country) => country.region === region,
    ),
  })).filter((group) => group.countries.length > 0);
}

export function featuredAfricaCountrySlugs() {
  return [
    "nigeria",
    "ghana",
    "south-africa",
    "tanzania",
    "uganda",
    "egypt",
    "morocco",
    "rwanda",
    "ethiopia",
    "cote-divoire",
  ];
}

export function countryIntro(country: AfricaCountryMarket) {
  const cityNames = country.cities.map((city) => city.name);
  const cityBit =
    cityNames.length > 0
      ? ` Search ${cityNames.slice(0, 4).join(", ")}${cityNames.length > 4 ? " and more" : ""}.`
      : "";
  return `${country.name} is on Your Home — verified houses, apartments, land, monthly rentals, and BnB stays across ${country.region}. ${REGION_HOOK[country.region]}.${cityBit} Compare prices, photos, and contact sellers or hosts.`;
}

export function countryGuide(country: AfricaCountryMarket) {
  return `Shortlist homes in ${country.name} by city, then confirm title, zoning, and a physical inspection with a local advocate or notary. Your Home lists verified sale, rental, land, commercial, and holiday stays — we are the marketplace, not the seller. Ask about utilities, access roads, and service charge before you pay a deposit.`;
}

export function countryHighlights(
  country: AfricaCountryMarket,
): [string, string, string] {
  const city = country.cities[0]?.name ?? country.name;
  return [
    `Houses, apartments, and land for sale in ${city} and across ${country.name}`,
    `Monthly rentals and BnB / Airbnb-style stays in ${country.region}`,
    "Verified photos, local prices, and direct contact with agents and owners",
  ];
}

export function cityIntro(city: AfricaCityMarket) {
  return `${city.name} is a top ${city.country} market on Your Home for property for sale, apartments for rent, land, and BnB holiday stays. Buyers, tenants, and guests compare listings in ${city.name}, ${city.country} with photos and asking prices — then message the host or agent.`;
}

export function cityGuide(city: AfricaCityMarket) {
  return `In ${city.name}, start with neighbourhood and commute, not only the asking price. Check title or lease, water and power backup, and building rules for apartments. Use Your Home to compare ${city.name} houses, rentals, and short stays, then complete due diligence on the ground in ${city.country}.`;
}

export function cityHighlights(
  city: AfricaCityMarket,
): [string, string, string] {
  return [
    `Property for sale in ${city.name}, ${city.country}`,
    `Apartments and houses for rent in ${city.name}`,
    `BnB, Airbnb, and holiday homes in ${city.name}`,
  ];
}

export function nearbyCountrySlugs(country: AfricaCountryMarket, limit = 4) {
  return AFRICA_COUNTRY_MARKETS.filter(
    (item) =>
      item.region === country.region &&
      item.slug !== country.slug &&
      item.name !== "Kenya",
  )
    .slice(0, limit)
    .map((item) => item.slug);
}

export function nearbyCitySlugs(city: AfricaCityMarket, limit = 5) {
  const sameCountry = AFRICA_CITY_MARKETS.filter(
    (item) => item.countrySlug === city.countrySlug && item.slug !== city.slug,
  ).map((item) => item.slug);
  if (sameCountry.length >= 2) return sameCountry.slice(0, limit);
  const sameRegion = AFRICA_CITY_MARKETS.filter(
    (item) => item.region === city.region && item.slug !== city.slug,
  )
    .slice(0, limit)
    .map((item) => item.slug);
  return [...new Set([...sameCountry, ...sameRegion])].slice(0, limit);
}
