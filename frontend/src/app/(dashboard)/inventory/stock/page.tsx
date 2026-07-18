"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/use-toast";
import { getStock, listWarehouses } from "@/modules/inventory/inventory.api";
import { TransferStockModal } from "@/modules/inventory/components/transfer-stock-modal";
import { AdjustStockModal } from "@/modules/inventory/components/adjust-stock-modal";
import { CACHE_KEYS } from "@/lib/constants";
import { BarChart3, ArrowRightLeft, Pencil } from "lucide-react";
import type { StockItem } from "@/modules/inventory/inventory.api";

export default function StockPage() {
  const queryClient = useQueryClient();
  const [warehouseFilter, setWarehouseFilter] = useState<string>("");
  const [transferData, setTransferData] = useState<StockItem | null>(null);
  const [adjustData, setAdjustData] = useState<StockItem | null>(null);

  const { data: warehouses } = useQuery({
    queryKey: [...CACHE_KEYS.WAREHOUSES, { limit: 100 }],
    queryFn: () => listWarehouses({ limit: 100 }),
  });

  const { data: stock, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.STOCK, { warehouseId: warehouseFilter || undefined }],
    queryFn: () => getStock({ warehouseId: warehouseFilter || undefined }),
  });

  const groupedByWarehouse = stock?.reduce<Record<string, StockItem[]>>((acc, item) => {
    const whName = item.warehouse.name;
    if (!acc[whName]) acc[whName] = [];
    acc[whName].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Levels</h2>
          <p className="text-muted-foreground text-sm">View and manage inventory stock across warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses?.data.map((wh) => (
              <option key={wh.id} value={wh.id}>{wh.name}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : isError ? (
        <EmptyState icon={<BarChart3 className="h-12 w-12" />} title="Failed to load stock" description="Try refreshing the page" />
      ) : !stock || stock.length === 0 ? (
        <EmptyState icon={<BarChart3 className="h-12 w-12" />} title="No stock records" description="Add products and receive stock to see levels here" />
      ) : (
        Object.entries(groupedByWarehouse || {}).map(([whName, items]) => (
          <Card key={whName}>
            <CardHeader className="pb-3">
              <h3 className="text-lg font-semibold">{whName}</h3>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">SKU</th>
                      <th className="pb-2 font-medium">Product</th>
                      <th className="pb-2 font-medium text-right">On Hand</th>
                      <th className="pb-2 font-medium text-right">Reserved</th>
                      <th className="pb-2 font-medium text-right">Available</th>
                      <th className="pb-2 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => {
                      const available = item.quantity - item.reserved_quantity;
                      return (
                        <tr key={item.id} className="border-b last:border-0">
                          <td className="py-2 font-mono text-xs">{item.product.sku}</td>
                          <td className="py-2">{item.product.name}</td>
                          <td className="py-2 text-right">{item.quantity}</td>
                          <td className="py-2 text-right">{item.reserved_quantity}</td>
                          <td className="py-2 text-right">
                            <Badge variant={available <= 0 ? "destructive" : available <= 10 ? "secondary" : "success"}>
                              {available}
                            </Badge>
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex gap-1 justify-end">
                              <Button variant="ghost" size="icon" onClick={() => setTransferData(item)} title="Transfer Stock">
                                <ArrowRightLeft className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setAdjustData(item)} title="Adjust Stock">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <TransferStockModal
        open={!!transferData}
        onOpenChange={() => setTransferData(null)}
        stockItem={transferData}
      />

      <AdjustStockModal
        open={!!adjustData}
        onOpenChange={() => setAdjustData(null)}
        stockItem={adjustData}
      />
    </div>
  );
}
