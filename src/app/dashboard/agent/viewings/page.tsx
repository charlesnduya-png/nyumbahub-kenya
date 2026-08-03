import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const viewings = [
  { id: "1", property: "Modern 3-Bed Apartment in Kilimani", client: "Peter Kamau", date: "2026-03-07", time: "10:00", status: "SCHEDULED" },
  { id: "2", property: "Family Maisonette in Runda", client: "Faith Wambui", date: "2026-03-07", time: "14:00", status: "SCHEDULED" },
  { id: "3", property: "2-Bed Furnished Rental in Westlands", client: "Sarah Njeri", date: "2026-03-10", time: "11:00", status: "CONFIRMED" },
  { id: "4", property: "Quarter-Acre Plot in Kitengela", client: "James Ochieng", date: "2026-03-05", time: "09:00", status: "COMPLETED" },
];

export default function AgentViewingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Viewings calendar</h1>
          <p className="text-muted-foreground">
            Schedule and manage property viewings with clients.
          </p>
        </div>
        <Button>Schedule viewing</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming & recent viewings</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Property</th>
                <th className="pb-3 pr-4 font-medium">Client</th>
                <th className="pb-3 pr-4 font-medium">Date</th>
                <th className="pb-3 pr-4 font-medium">Time</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {viewings.map((v) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium max-w-[200px]">{v.property}</td>
                  <td className="py-3 pr-4">{v.client}</td>
                  <td className="py-3 pr-4">{v.date}</td>
                  <td className="py-3 pr-4">{v.time}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={v.status === "COMPLETED" ? "secondary" : "default"}>
                      {v.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Button size="sm" variant="outline">Details</Button>
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
