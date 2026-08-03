import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pending = [
  { id: "1", type: "Agent", name: "Faith Mwangi", doc: "EARB License #0312", submitted: "2026-02-25" },
  { id: "2", type: "Seller", name: "Mary Wanjiru", doc: "National ID + Title deed", submitted: "2026-02-24" },
  { id: "3", type: "Listing", name: "Quarter-Acre Plot Kitengela", doc: "Green card scan", submitted: "2026-02-23" },
];

export default function AdminVerificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Verification</h1>
        <p className="text-muted-foreground">
          Review agent licenses, seller IDs, and title deed documents.
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>Pending verifications</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Type</th>
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Document</th>
                <th className="pb-3 pr-4 font-medium">Submitted</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3 pr-4"><Badge variant="outline">{item.type}</Badge></td>
                  <td className="py-3 pr-4 font-medium">{item.name}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{item.doc}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{item.submitted}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="outline">Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
