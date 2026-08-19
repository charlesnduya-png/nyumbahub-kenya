"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SellerAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Listing analytics</h1>
        <p className="text-muted-foreground">
          See how many people viewed your listings and which ones convert best.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>No analytics yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Analytics will appear once you have active listings with views. Publish a
            listing to start tracking performance.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/seller/properties/new">Add a listing</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
