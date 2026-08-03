import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const clients = [
  { id: "1", name: "Peter Kamau", phone: "0712345678", budget: "KES 15–20M", status: "ACTIVE", area: "Kilimani / Westlands" },
  { id: "2", name: "Sarah Njeri", phone: "0723456789", budget: "KES 80–120K/mo", status: "ACTIVE", area: "Westlands rental" },
  { id: "3", name: "James Ochieng", phone: "0734567890", budget: "KES 5–8M", status: "NEGOTIATING", area: "Kitengela plots" },
  { id: "4", name: "Faith Wambui", phone: "0745678901", budget: "KES 35–50M", status: "ACTIVE", area: "Karen / Runda" },
];

export default function AgentClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Track buyer preferences, budgets, and communication history.
          </p>
        </div>
        <Button>Add client</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client roster ({clients.length})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-3 pr-4 font-medium">Name</th>
                <th className="pb-3 pr-4 font-medium">Phone</th>
                <th className="pb-3 pr-4 font-medium">Budget</th>
                <th className="pb-3 pr-4 font-medium">Preferred area</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4">{c.phone}</td>
                  <td className="py-3 pr-4">{c.budget}</td>
                  <td className="py-3 pr-4 text-muted-foreground">{c.area}</td>
                  <td className="py-3 pr-4">
                    <Badge variant={c.status === "ACTIVE" ? "default" : "secondary"}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="py-3">
                    <Button size="sm" variant="outline">View</Button>
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
