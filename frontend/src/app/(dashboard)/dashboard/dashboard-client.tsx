"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { Package, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";

export function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { title: "Total Revenue", value: "$0.00", icon: DollarSign, change: "+0%" },
    { title: "Active Orders", value: "0", icon: ShoppingCart, change: "+0" },
    { title: "Inventory Items", value: "0", icon: Package, change: "+0" },
    { title: "Growth", value: "0%", icon: TrendingUp, change: "+0%" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName} {user?.lastName}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
