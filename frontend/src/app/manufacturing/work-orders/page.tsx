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
import {
  listWorkOrders, getWoStatusLabel, getWoStatusColor, getPriorityLabel, getPriorityColor,
  type WorkOrder,
} from "@/modules/manufacturing/manufacturing.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { Plus, Search, ClipboardList, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const STATUSES = ["", "draft", "planned", "in_progress", "completed", "cancelled"];

export default function WorkOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.WORK_ORDERS, { page, limit: 20, search, status: statusFilter || undefined }],
    queryFn: () => listWorkOrders({ page, limit: 20, search, status: statusFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<WorkOrder>[] = [
    {
      accessorKey: "work_order_number",
      header: "WO #",
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDER_DETAIL(row.original.id))}
        >
          {row.original.work_order_number}
        </button>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => row.original.product?.name || "—",
    },
    {
      accessorKey: "work_center",
      header: "Work Center",
      cell: ({ row }) => row.original.work_center?.name || "—",
    },
    {
      accessorKey: "quantity",
      header: "Qty",
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => (
        <Badge variant={getPriorityColor(row.original.priority)}>
          {getPriorityLabel(row.original.priority)}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getWoStatusColor(row.original.status)}>
          {getWoStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDER_DETAIL(row.original.id))}>
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
          <h2 className="text-2xl font-bold tracking-tight">Work Orders</h2>
          <p className="text-muted-foreground text-sm">Manage production work orders</p>
        </div>
        <Button onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDER_NEW)}>
          <Plus className="mr-2 h-4 w-4" /> New Work Order
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by WO number or product..."
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
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{getWoStatusLabel(s)}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="Failed to load work orders" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<ClipboardList className="h-12 w-12" />} title="No work orders found" description="Create a work order to get started" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
