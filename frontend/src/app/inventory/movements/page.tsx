"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { listMovements, listWarehouses } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Search, History } from "lucide-react";
import type { StockMovement } from "@/modules/inventory/inventory.api";
import type { ColumnDef } from "@tanstack/react-table";

const MOVEMENT_TYPES: Record<string, { label: string; variant: "success" | "destructive" | "secondary" | "outline" }> = {
  transfer_in: { label: "Transfer In", variant: "success" },
  transfer_out: { label: "Transfer Out", variant: "destructive" },
  adjustment: { label: "Adjustment", variant: "secondary" },
  sale: { label: "Sale", variant: "destructive" },
  purchase: { label: "Purchase", variant: "success" },
  return: { label: "Return", variant: "outline" },
};

export default function MovementsPage() {
  const [page, setPage] = useState(1);
  const [productFilter, setProductFilter] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data: warehouses } = useQuery({
    queryKey: [...CACHE_KEYS.WAREHOUSES, { limit: 100 }],
    queryFn: () => listWarehouses({ limit: 100 }),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.MOVEMENTS, { page, limit: 20, productId: productFilter || undefined, warehouseId: warehouseFilter || undefined, movementType: typeFilter || undefined }],
    queryFn: () => listMovements({ page, limit: 20, productId: productFilter || undefined, warehouseId: warehouseFilter || undefined, movementType: typeFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<StockMovement>[] = [
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => new Date(row.original.created_at).toLocaleString(),
    },
    {
      accessorKey: "movement_type",
      header: "Type",
      cell: ({ row }) => {
        const type = MOVEMENT_TYPES[row.original.movement_type] || { label: row.original.movement_type, variant: "secondary" as const };
        return <Badge variant={type.variant}>{type.label}</Badge>;
      },
    },
    {
      accessorKey: "product.sku",
      header: "SKU",
      cell: ({ row }) => row.original.product.sku,
    },
    {
      accessorKey: "product.name",
      header: "Product",
      cell: ({ row }) => row.original.product.name,
    },
    {
      accessorKey: "warehouse.name",
      header: "Warehouse",
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      cell: ({ row }) => {
        const qty = row.original.quantity;
        return (
          <span className={qty < 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
            {qty > 0 ? "+" : ""}{qty}
          </span>
        );
      },
    },
    {
      accessorKey: "notes",
      header: "Notes",
      cell: ({ row }) => row.original.notes || "—",
    },
    {
      accessorKey: "created_by_user",
      header: "By",
      cell: ({ row }) => row.original.created_by_user?.name || "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Stock Movements</h2>
        <p className="text-muted-foreground text-sm">History of all stock changes</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filter by SKU..."
                value={productFilter}
                onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
                className="max-w-[200px]"
              />
            </div>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[180px]"
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Warehouses</option>
              {warehouses?.data.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm max-w-[160px]"
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Types</option>
              {Object.entries(MOVEMENT_TYPES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<History className="h-12 w-12" />} title="Failed to load movements" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<History className="h-12 w-12" />} title="No movements found" description="Stock movements will appear here" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
