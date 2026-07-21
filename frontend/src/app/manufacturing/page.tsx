"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { listWorkOrders } from "@/modules/manufacturing/manufacturing.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ClipboardList, LayoutList, Wrench, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export default function ManufacturingOverviewPage() {
  const router = useRouter();
  const { data: woData, isLoading } = useQuery({
    queryKey: [...CACHE_KEYS.WORK_ORDERS, { limit: 5 }],
    queryFn: () => listWorkOrders({ limit: 5 }),
  });

  const orders = woData?.data || [];
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  const statsCards = [
    {
      title: "Total Work Orders",
      value: woData?.meta.total ?? 0,
      icon: ClipboardList,
      color: "text-blue-600",
      onClick: () => router.push(ROUTES.MANUFACTURING_WORK_ORDERS),
    },
    {
      title: "In Progress",
      value: statusCounts["in_progress"] || 0,
      icon: Clock,
      color: "text-amber-600",
      onClick: () => router.push(ROUTES.MANUFACTURING_WORK_ORDERS),
    },
    {
      title: "Completed",
      value: statusCounts["completed"] || 0,
      icon: CheckCircle2,
      color: "text-green-600",
      onClick: () => router.push(ROUTES.MANUFACTURING_WORK_ORDERS),
    },
    {
      title: "BOMs",
      value: "—",
      icon: LayoutList,
      color: "text-purple-600",
      onClick: () => router.push(ROUTES.MANUFACTURING_BOM),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Manufacturing</h2>
        <p className="text-muted-foreground text-sm">Manage production, BOMs, and work centers</p>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((card) => (
              <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={card.onClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Work Orders</CardTitle>
                <span
                  className="text-sm text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDERS)}
                >
                  View all
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm">No work orders yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {orders.map((wo) => (
                    <div
                      key={wo.id}
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
                      onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDER_DETAIL(wo.id))}
                    >
                      <div>
                        <p className="text-sm font-medium">{wo.work_order_number}</p>
                        <p className="text-xs text-muted-foreground">{wo.product.name}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{wo.quantity} units</p>
                        <p className="text-xs capitalize text-muted-foreground">{wo.status.replace("_", " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
