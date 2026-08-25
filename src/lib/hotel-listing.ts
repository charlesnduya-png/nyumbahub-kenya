/** Add-hotel form inside professional admin. */
export const ADD_HOTEL_PATH = "/dashboard/seller/properties/new?type=HOTEL";

export function addHotelPath() {
  return ADD_HOTEL_PATH;
}

export function listHotelHref({
  isLoggedIn,
  role,
}: {
  isLoggedIn: boolean;
  role?: string | null;
}) {
  if (
    isLoggedIn &&
    (role === "SELLER" || role === "AGENT" || role === "ADMIN")
  ) {
    return ADD_HOTEL_PATH;
  }

  if (isLoggedIn) {
    return "/register/professional?intent=hotel";
  }

  return `/login?callbackUrl=${encodeURIComponent(ADD_HOTEL_PATH)}`;
}

export function isProfessionalRole(role?: string | null) {
  return role === "SELLER" || role === "AGENT" || role === "ADMIN";
}

export function safeCallbackPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}
