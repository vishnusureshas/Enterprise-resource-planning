"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { listShipments, getShipmentStatusLabel, getShipmentStatusColor, type Shipment, type ShipmentStatus } from "@/modules/shipping/shipping.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { Package, Search, Plus, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const STATUSES: (ShipmentStatus | "")[] = ["", "draft", "pending", "dispatched", "in_transit", "delivered", "failed", "returned"];

export default function ShipmentsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.SHIPPING_SHIPMENTS, { page, limit: 20, search, status: statusFilter || undefined }],
    queryFn: () => listShipments({ page, limit: 20, search, status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<Shipment>[] = [
    {
      accessorKey: "shipment_number",
      header: "Shipment #",
      cell: ({ row }) => (
        <button className="font-medium text-primary hover:underline text-left"
          onClick={() => router.push(ROUTES.SHIPPING_SHIPMENT_DETAIL(row.original.id))}>
          {row.original.shipment_number}
        </button>
      ),
    },
    {
      accessorKey: "carrier",
      header: "Carrier",
      cell: ({ row }) => row.original.carrier?.name || "—",
    },
    {
      accessorKey: "carrier_tracking_number",
      header: "Tracking #",
      cell: ({ row }) => row.original.carrier_tracking_number || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getShipmentStatusColor(row.original.status) as any}>
          {getShipmentStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "destination_address",
      header: "Destination",
      cell: ({ row }) => row.original.destination_address || "—",
    },
    {
      accessorKey: "estimated_delivery_date",
      header: "Est. Delivery",
      cell: ({ row }) => row.original.estimated_delivery_date
        ? new Date(row.original.estimated_delivery_date).toLocaleDateString() : "—",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.SHIPPING_SHIPMENT_DETAIL(row.original.id))}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Shipments</h2>
          <p className="text-muted-foreground text-sm">Manage outgoing shipments</p>
        </div>
        <Button onClick={() => router.push(ROUTES.SHIPPING_SHIPMENT_NEW)}>
          <Plus className="mr-2 h-4 w-4" /> New Shipment
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search shipment number or tracking..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
            <select className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{getShipmentStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner />
            : isError ? <EmptyState icon={<Package className="h-12 w-12" />} title="Failed to load shipments" description="Try refreshing" />
            : data && data.data.length > 0 ? (
              <DataTable columns={columns} data={data.data} total={data.meta.total}
                pageIndex={page - 1} onPageChange={(p) => setPage(p + 1)} />
            ) : (
              <EmptyState icon={<Package className="h-12 w-12" />} title="No shipments" description="Create a shipment to get started" />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
