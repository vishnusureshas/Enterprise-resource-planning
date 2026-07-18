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
  listOrders, cancelOrder, getOrderStatusLabel, getOrderStatusColor,
  type SalesOrder, type OrderStatus,
} from "@/modules/order/order.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { Plus, Search, ShoppingCart, Eye, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const ORDER_STATUSES: (OrderStatus | "")[] = ["", "draft", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"];

export default function OrdersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.ORDERS, { page, limit: 20, search, status: statusFilter || undefined }],
    queryFn: () => listOrders({ page, limit: 20, search, status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDERS });
      toast({ title: "Order cancelled", variant: "success" });
      setCancelId(null);
    },
    onError: () => toast({ title: "Failed to cancel order", variant: "destructive" }),
  });

  const columns: ColumnDef<SalesOrder>[] = [
    {
      accessorKey: "order_number",
      header: "Order #",
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={() => router.push(ROUTES.ORDER_DETAIL(row.original.id))}
        >
          {row.original.order_number}
        </button>
      ),
    },
    {
      accessorKey: "customer",
      header: "Customer",
      cell: ({ row }) => row.original.customer?.name || "—",
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
        <Badge variant={getOrderStatusColor(row.original.status)}>
          {getOrderStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "grand_total",
      header: "Total",
      cell: ({ row }) => `$${Number(row.original.grand_total).toFixed(2)}`,
    },
    {
      accessorKey: "paid_amount",
      header: "Paid",
      cell: ({ row }) => `$${Number(row.original.paid_amount || 0).toFixed(2)}`,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.ORDER_DETAIL(row.original.id))}>
            <Eye className="h-4 w-4" />
          </Button>
          {row.original.status === "draft" || row.original.status === "confirmed" || row.original.status === "processing" ? (
            <Button variant="ghost" size="icon" onClick={() => setCancelId(row.original.id)}>
              <XCircle className="h-4 w-4 text-destructive" />
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Orders</h2>
          <p className="text-muted-foreground text-sm">Manage customer orders</p>
        </div>
        <Button onClick={() => router.push(ROUTES.ORDER_NEW)}>
          <Plus className="mr-2 h-4 w-4" /> New Order
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order number or customer..."
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
              {ORDER_STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="Failed to load orders" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<ShoppingCart className="h-12 w-12" />} title="No orders found" description="Create an order to get started" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
