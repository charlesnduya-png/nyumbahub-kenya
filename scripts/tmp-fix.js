const fs = require("fs");
const path = "src/app/api/rental-plots/[id]/route.ts";
let t = fs.readFileSync(path, "utf8");
t = t.replace(
  `import {
  assertCanCreateListing,
  getActiveListingSubscription,
  LISTINGS_ARE_FREE,
} from "@/lib/listing-subscription";`,
  `import { assertCanCreateListing } from "@/lib/listing-subscription";`,
);
t = t.replace(
  `    const role = session.user.role;
    const submitForReview = parsed.data.submitForReview !== false;
    const isAgent = role === "AGENT";
    const isAdmin = role === "ADMIN";

    const canCreate = await assertCanCreateListing({
      userId: session.user.id,
      role,
    });`,
  `    const role = session.user.role;
    const submitForReview = parsed.data.submitForReview !== false;

    const canCreate = await assertCanCreateListing({
      userId: session.user.id,
      role,
    });`,
);
fs.writeFileSync(path, t);
console.log("cleaned");
