import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ads = [
  { id: "1", title: "KCB Home Loan — March promo", placement: "HOME_BANNER", clicks: 1240, impressions: 45000, active: true },
  { id: "2", title: "Diani Beach Villas", placement: "SEARCH_SPONSORED", clicks: 890, impressions: 22000, active: true },
  { id: "3", title: "Ardhi Sasa awareness", placement: "SIDEBAR", clicks: 340, impressions: 18000, active: false },
];

export default function AdminAdsPage() {
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
              {ads.map((ad) => (
                <tr key={ad.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{ad.title}</td>
                  <td className="py-3 pr-4"><Badge variant="outline">{ad.placement}</Badge></td>
                  <td className="py-3 pr-4">{ad.clicks.toLocaleString()}</td>
                  <td className="py-3 pr-4">{ad.impressions.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={ad.active ? "default" : "secondary"}>{ad.active ? "Active" : "Paused"}</Badge>
                  </td>
                  <td className="py-3"><Button size="sm" variant="outline">Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
