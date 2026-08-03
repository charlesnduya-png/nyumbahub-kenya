import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pipeline = [
  { stage: "New leads", count: 5, items: ["Peter K. — Kilimani apt", "David M. — Karen house"] },
  { stage: "Contacted", count: 3, items: ["Sarah N. — Westlands rental"] },
  { stage: "Viewing scheduled", count: 4, items: ["James O. — Kitengela plot", "Faith W. — Runda"] },
  { stage: "Negotiating", count: 2, items: ["Michael T. — Lavington"] },
  { stage: "Won", count: 8, items: ["Closed: Nyali beach apt"] },
];

export default function AgentCrmPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">CRM pipeline</h1>
        <p className="text-muted-foreground">
          Track deals from first enquiry to signed agreement.
        </p>
      </div>

      <Tabs defaultValue="board">
        <TabsList>
          <TabsTrigger value="board">Pipeline board</TabsTrigger>
          <TabsTrigger value="list">List view</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {pipeline.map((col) => (
              <Card key={col.stage}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    {col.stage}
                    <Badge variant="secondary">{col.count}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {col.items.map((item) => (
                    <div
                      key={item}
                      className="rounded-md border bg-muted/50 p-2 text-xs"
                    >
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardContent className="p-6 text-muted-foreground">
              Switch to board view for kanban-style deal management.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
