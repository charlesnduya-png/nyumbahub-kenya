import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockProperties } from "@/data/mock";
import { formatPrice } from "@/lib/utils";

export default function AdminPropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Properties</h1>
        <p className="text-muted-foreground">Moderate and manage all platform listings.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>All listings</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Title</th>
                <th className="pb-3 pr-4 font-medium">Price</th>
                <th className="pb-3 pr-4 font-medium">Location</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Verified</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockProperties.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium max-w-[200px] truncate">{p.title}</td>
                  <td className="py-3 pr-4">{formatPrice(p.price)}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{p.town}, {p.county}</td>
                  <td className="py-3 pr-4"><Badge>{p.status}</Badge></td>
                  <td className="py-3 pr-4">{p.isVerified ? "Yes" : "No"}</td>
                  <td className="py-3"><Button size="sm" variant="outline">Review</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
