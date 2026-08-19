import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { prisma } from "@/lib/prisma";

export default async function AdminAdsPage() {
  const ads = await prisma.advertisement.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      placement: true,
      clicks: true,
      impressions: true,
      isActive: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Advertisements</h1>
          <p className="text-muted-foreground">Manage banners, sponsored listings, and sidebar ads.</p>
        </div>
        <Button>Create ad</Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Campaigns</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Placement</th>
                <th className="pb-3 pr-4 font-medium">Clicks</th>
                <th className="pb-3 pr-4 font-medium">Impressions</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.length === 0 ? (
                <tr>
                  <td
                    className="py-8 text-center text-sm text-muted-foreground"
                    colSpan={6}
                  >
                    No advertisements yet.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => (
                  <tr key={ad.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{ad.title}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline">{ad.placement}</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      {ad.clicks.toLocaleString("en-KE")}
                    </td>
                    <td className="py-3 pr-4">
                      {ad.impressions.toLocaleString("en-KE")}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge variant={ad.isActive ? "default" : "secondary"}>
                        {ad.isActive ? "Active" : "Paused"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <Button size="sm" variant="outline" disabled>
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
