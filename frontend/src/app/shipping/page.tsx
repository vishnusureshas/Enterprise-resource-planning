"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { listShipments, listCarriers, getShipmentStatusLabel } from "@/modules/shipping/shipping.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Package, Building2, Truck, Clock } from "lucide-react";

export default function ShippingOverviewPage() {
  const { data: shipmentsData, isLoading: shipmentsLoading } = useQuery({
    queryKey: [...CACHE_KEYS.SHIPPING_SHIPMENTS, { limit: 5 }],
    queryFn: () => listShipments({ limit: 5 }),
  });

  const { data: carriersData, isLoading: carriersLoading } = useQuery({
    queryKey: [...CACHE_KEYS.SHIPPING_CARRIERS, { limit: 5 }],
    queryFn: () => listCarriers({ limit: 5 }),
  });

  if (shipmentsLoading || carriersLoading) return <LoadingSpinner fullPage={false} />;

  const shipments = shipmentsData?.data || [];
  const carriers = carriersData?.data || [];
  const statusCounts: Record<string, number> = {};
  shipments.forEach((s) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Shipping & Logistics</h2>
        <p className="text-muted-foreground text-sm">Manage shipments, carriers, and tracking</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{shipments.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Carriers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{carriers.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{statusCounts["in_transit"] || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Dispatch</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(statusCounts["pending"] || 0) + (statusCounts["draft"] || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Shipments</CardTitle>
          </CardHeader>
          <CardContent>
            {shipments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No shipments yet</p>
            ) : (
              <div className="space-y-2">
                {shipments.slice(0, 5).map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{s.shipment_number}</span>
                    <span className="text-muted-foreground">{getShipmentStatusLabel(s.status)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Carriers</CardTitle>
          </CardHeader>
          <CardContent>
            {carriers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No carriers configured</p>
            ) : (
              <div className="space-y-2">
                {carriers.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{c.name}</span>
                    <span className="text-muted-foreground">{c.code}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
