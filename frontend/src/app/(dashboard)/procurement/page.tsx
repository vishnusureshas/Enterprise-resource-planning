"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/use-toast";
import {
  listPurchaseOrders, getPoStatusLabel, getPoStatusColor,
  type PurchaseOrder, type PoStatus,
} from "@/modules/procurement/purchase-order.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { Plus, Search, Truck, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const PO_STATUSES: (PoStatus | "")[] = ["", "draft", "pending", "approved", "ordered", "partial", "received", "cancelled"];

export default function ProcurementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.PURCHASE_ORDERS, { page, limit: 20, search, status: statusFilter || undefined }],
    queryFn: () => listPurchaseOrders({ page, limit: 20, search, status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<PurchaseOrder>[] = [
    {
      accessorKey: "po_number",
      header: "PO #",
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={() => router.push(ROUTES.PROCUREMENT_DETAIL(row.original.id))}
        >
          {row.original.po_number}
        </button>
      ),
    },
    {
      accessorKey: "vendor",
      header: "Vendor",
      cell: ({ row }) => row.original.vendor?.name || "—",
    },
    {
      accessorKey: "order_date",
      header: "Date",
      cell: ({ row }) => new Date(row.original.order_date).toLocaleDateString(),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getPoStatusColor(row.original.status)}>
          {getPoStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "grand_total",
      header: "Total",
      cell: ({ row }) => `$${Number(row.original.grand_total).toFixed(2)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.PROCUREMENT_DETAIL(row.original.id))}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase Orders</h2>
          <p className="text-muted-foreground text-sm">Manage procurement and vendor orders</p>
        </div>
        <Button onClick={() => router.push(ROUTES.PROCUREMENT_NEW)}>
          <Plus className="mr-2 h-4 w-4" /> New Purchase Order
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by PO number or vendor..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              {PO_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{getPoStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<Truck className="h-12 w-12" />} title="Failed to load purchase orders" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<Truck className="h-12 w-12" />} title="No purchase orders found" description="Create a purchase order to get started" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
