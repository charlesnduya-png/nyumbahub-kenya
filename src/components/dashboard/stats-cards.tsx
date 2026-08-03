import {
  BarChart3,
  Building2,
  Eye,
  MessageSquare,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentDashboardStats, DashboardStats } from "@/types";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className="text-xs text-primary mt-1 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function SellerStatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active listings"
        value={stats.activeListings}
        description={`${stats.totalListings} total · ${stats.pendingListings} pending`}
        icon={Building2}
      />
      <StatCard
        title="Total views"
        value={stats.totalViews.toLocaleString()}
        icon={Eye}
        trend="+12% this month"
      />
      <StatCard
        title="Leads"
        value={stats.totalLeads}
        description={`${stats.newLeads} new enquiries`}
        icon={MessageSquare}
      />
      <StatCard
        title="Conversion rate"
        value={`${stats.conversionRate}%`}
        description={`${stats.featuredListings} featured listings`}
        icon={BarChart3}
      />
    </div>
  );
}

export function AgentStatsCards({ stats }: { stats: AgentDashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active clients"
        value={stats.totalClients}
        icon={Users}
      />
      <StatCard
        title="Scheduled viewings"
        value={stats.scheduledViewings}
        icon={Eye}
      />
      <StatCard
        title="Agent rating"
        value={stats.averageRating}
        description={`${stats.reviewCount} reviews`}
        icon={Star}
      />
      <StatCard
        title="Leads this month"
        value={stats.newLeads}
        description={`${stats.activeListings} active listings`}
        icon={MessageSquare}
      />
    </div>
  );
}

export function AdminStatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total users" value="2,847" icon={Users} trend="+8% MoM" />
      <StatCard title="Active listings" value="1,203" icon={Building2} />
      <StatCard title="Pending moderation" value="23" icon={MessageSquare} />
      <StatCard title="Revenue (MTD)" value="KES 1.2M" icon={BarChart3} />
    </div>
  );
}
