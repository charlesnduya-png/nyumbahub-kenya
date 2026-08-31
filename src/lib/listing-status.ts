export const LISTING_STATUSES = [
  "DRAFT",
  "PENDING",
  "ACTIVE",
  "SOLD",
  "RENTED",
  "EXPIRED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Statuses a professional can set on their own listings (not admin-only). */
export const OWNER_LISTING_STATUSES = [
  "DRAFT",
  "PENDING",
  "SOLD",
  "RENTED",
  "EXPIRED",
  "ARCHIVED",
] as const satisfies readonly ListingStatus[];

export type OwnerListingStatus = (typeof OWNER_LISTING_STATUSES)[number];

export function isOwnerListingStatus(
  status: string,
): status is OwnerListingStatus {
  return (OWNER_LISTING_STATUSES as readonly string[]).includes(status);
}

export function listingStatusLabel(status: string) {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "PENDING":
      return "Pending review";
    case "ACTIVE":
      return "Live";
    case "SOLD":
      return "Sold";
    case "RENTED":
      return "Rented";
    case "EXPIRED":
      return "Expired";
    case "REJECTED":
      return "Rejected";
    case "ARCHIVED":
      return "Archived";
    default:
      return status;
  }
}

export function listingStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "PENDING" || status === "DRAFT") return "outline";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

/** Status options shown in the professional listings manager for a listing type. */
export function ownerStatusOptionsForListing(
  listingType: string,
  currentStatus: string,
): { value: OwnerListingStatus; label: string }[] {
  const options: { value: OwnerListingStatus; label: string }[] = [];

  if (currentStatus === "ACTIVE") {
    if (listingType === "BUY" || listingType === "LAND" || listingType === "COMMERCIAL") {
      options.push({ value: "SOLD", label: "Mark as sold" });
    }
    if (listingType === "RENT") {
      options.push({ value: "RENTED", label: "Mark as rented" });
    }
    if (listingType === "HOLIDAY" || listingType === "HOTEL") {
      options.push({ value: "EXPIRED", label: "Mark as unavailable" });
    }
    if (listingType !== "HOLIDAY" && listingType !== "HOTEL") {
      options.push({ value: "EXPIRED", label: "Mark as expired" });
    }
    options.push({ value: "ARCHIVED", label: "Archive listing" });
  }

  if (["SOLD", "RENTED", "EXPIRED", "ARCHIVED", "DRAFT"].includes(currentStatus)) {
    options.push({ value: "PENDING", label: "Submit for review" });
  }

  if (currentStatus !== "DRAFT" && currentStatus !== "PENDING") {
    options.push({ value: "DRAFT", label: "Move to draft" });
  }

  if (currentStatus === "PENDING") {
    options.push({ value: "DRAFT", label: "Withdraw to draft" });
    options.push({ value: "ARCHIVED", label: "Archive listing" });
  }

  if (currentStatus === "REJECTED") {
    options.push({ value: "PENDING", label: "Resubmit for review" });
    options.push({ value: "ARCHIVED", label: "Archive listing" });
  }

  // Deduplicate by value
  const seen = new Set<string>();
  return options.filter((opt) => {
    if (seen.has(opt.value)) return false;
    seen.add(opt.value);
    return true;
  });
}

export function allOwnerStatusSelectOptions(
  listingType: string,
): { value: OwnerListingStatus; label: string }[] {
  const base: { value: OwnerListingStatus; label: string }[] = [
    { value: "DRAFT", label: "Draft" },
    { value: "PENDING", label: "Pending review" },
    { value: "ARCHIVED", label: "Archived" },
    { value: "EXPIRED", label: "Expired" },
  ];

  if (listingType === "BUY" || listingType === "LAND" || listingType === "COMMERCIAL") {
    base.splice(2, 0, { value: "SOLD", label: "Sold" });
  }
  if (listingType === "RENT") {
    base.splice(2, 0, { value: "RENTED", label: "Rented" });
  }
  if (listingType === "HOLIDAY" || listingType === "HOTEL") {
    // Stays use expired/archived rather than sold/rented long-term
  }

  return base;
}
