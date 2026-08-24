import Link from "next/link";
import { Palmtree, Star } from "lucide-react";

import { MembershipCard } from "@/components/membership/membership-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { getCustomerMembership } from "@/lib/customer-membership";
import {
  MEMBERSHIP_NAME,
  membershipForStays,
  staysToNextLevel,
} from "@/lib/membership";
import { prisma } from "@/lib/prisma";

export default async function TenantMembershipPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const membership = userId
    ? await getCustomerMembership(userId)
    : {
        stays: 0,
        ...membershipForStays(0),
        next: staysToNextLevel(0),
      };

  const reviews = userId
    ? await prisma.review.count({ where: { userId } })
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{MEMBERSHIP_NAME}</h1>
        <p className="mt-1 text-muted-foreground">
          Free for every customer account. Sign in to save 10% or more on BnB
          stays, then review like a Booking.com guest after checkout.
        </p>
      </div>

      <MembershipCard membership={membership} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="space-y-3 p-5">
            <Palmtree className="h-8 w-8 text-primary" />
            <h2 className="font-semibold">Book with member prices</h2>
            <p className="text-sm text-muted-foreground">
              Your discount is applied automatically when you request a BnB stay
              while signed in.
            </p>
            <Button asChild>
              <Link href="/bnb">Browse BnBs</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-3 p-5">
            <Star className="h-8 w-8 text-primary" />
            <h2 className="font-semibold">Guest reviews</h2>
            <p className="text-sm text-muted-foreground">
              After checkout, score host, cleanliness, comfort, value, and
              location from 1 to 10.
            </p>
            <p className="text-sm">
              You have published {reviews} review{reviews === 1 ? "" : "s"}.
            </p>
            <Button variant="outline" asChild>
              <Link href="/dashboard/tenant/reviews">My reviews</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
