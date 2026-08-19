/** Default map centres for Kenyan counties (lat, lng) */
export const COUNTY_MAP_CENTERS: Record<string, { lat: number; lng: number }> =
  {
    Nairobi: { lat: -1.286389, lng: 36.817223 },
    Mombasa: { lat: -4.043477, lng: 39.668206 },
    Kisumu: { lat: -0.091702, lng: 34.767956 },
    Nakuru: { lat: -0.303099, lng: 36.080025 },
    Kiambu: { lat: -1.1714, lng: 36.8356 },
    Machakos: { lat: -1.5177, lng: 37.2634 },
    Kajiado: { lat: -1.8525, lng: 36.7762 },
    Uasin: { lat: 0.514277, lng: 35.269779 },
    "Uasin Gishu": { lat: 0.514277, lng: 35.269779 },
    Kilifi: { lat: -3.5107, lng: 39.9093 },
    Kwale: { lat: -4.1816, lng: 39.4606 },
    Nyeri: { lat: -0.4197, lng: 36.9475 },
    Meru: { lat: 0.0469, lng: 37.6559 },
    Kakamega: { lat: 0.2827, lng: 34.7519 },
    Bungoma: { lat: 0.5695, lng: 34.5584 },
    Eldoret: { lat: 0.514277, lng: 35.269779 },
    Naivasha: { lat: -0.7178, lng: 36.4310 },
  };

/** Kenya overview when county is unknown */
export const KENYA_MAP_CENTER = { lat: -0.0236, lng: 37.9062, zoom: 6 };

export function centerForCounty(county?: string | null): {
  lat: number;
  lng: number;
  zoom: number;
} {
  if (!county) {
    return { ...KENYA_MAP_CENTER };
  }
  const key = Object.keys(COUNTY_MAP_CENTERS).find(
    (k) => k.toLowerCase() === county.trim().toLowerCase(),
  );
  if (key) {
    return { ...COUNTY_MAP_CENTERS[key], zoom: 13 };
  }
  return { ...KENYA_MAP_CENTER, zoom: 8 };
}

export function hasValidCoordinates(
  lat?: number | null,
  lng?: number | null,
): boolean {
  return (
    lat != null &&
    lng != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export function googleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function openStreetMapEmbedUrl(lat: number, lng: number): string {
  const delta = 0.012;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
