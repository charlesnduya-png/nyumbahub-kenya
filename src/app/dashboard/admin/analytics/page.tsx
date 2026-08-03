import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Platform analytics</h1>
        <p className="text-muted-foreground">
          Growth, engagement, and revenue metrics for NyumbaHub Kenya.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Monthly active users", value: "18,420", change: "+14%" },
          { label: "New listings (30d)", value: "342", change: "+8%" },
          { label: "Lead enquiries (30d)", value: "2,847", change: "+22%" },
          { label: "Revenue (30d)", value: "KES 1.2M", change: "+18%" },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-primary mt-1">{stat.change} vs last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Listings by county</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { county: "Nairobi", pct: 42 },
              { county: "Mombasa", pct: 18 },
              { county: "Kiambu", pct: 12 },
              { county: "Nakuru", pct: 8 },
              { county: "Other", pct: 20 },
            ].map((item) => (
              <div key={item.county} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.county}</span>
                  <span className="text-muted-foreground">{item.pct}%</span>
                </div>
                <Progress value={item.pct} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>User registration trend</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { month: "Nov 2025", users: 420 },
              { month: "Dec 2025", users: 580 },
              { month: "Jan 2026", users: 720 },
              { month: "Feb 2026", users: 890 },
            ].map((item) => (
              <div key={item.month} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{item.month}</span>
                  <span className="text-muted-foreground">{item.users} new users</span>
                </div>
                <Progress value={(item.users / 1000) * 100} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
