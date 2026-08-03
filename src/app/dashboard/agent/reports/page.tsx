import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AgentReportsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Performance reports</h1>
        <p className="text-muted-foreground">
          Monthly sales activity, lead conversion, and client satisfaction.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Listings managed", value: "24", change: "+3 this month" },
          { label: "Deals closed (YTD)", value: "12", change: "KES 142M volume" },
          { label: "Avg. days to close", value: "38", change: "-5 days vs last quarter" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lead conversion funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { stage: "Enquiries received", count: 48, pct: 100 },
            { stage: "Viewings scheduled", count: 22, pct: 46 },
            { stage: "Offers made", count: 9, pct: 19 },
            { stage: "Deals closed", count: 4, pct: 8 },
          ].map((item) => (
            <div key={item.stage} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{item.stage}</span>
                <span className="text-muted-foreground">{item.count} ({item.pct}%)</span>
              </div>
              <Progress value={item.pct} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
