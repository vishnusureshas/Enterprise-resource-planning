"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { DataTable } from "@/components/shared/data-table";
import {
  getBom, explodeBom,
  type BomExplosionItem,
} from "@/modules/manufacturing/manufacturing.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, LayoutList, AlertCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export default function BomDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [showExplode, setShowExplode] = useState(false);

  const { data: bom, isLoading: loadingBom } = useQuery({
    queryKey: CACHE_KEYS.BOM(id),
    queryFn: () => getBom(id),
  });

  const { data: explosion, isLoading: loadingExplode } = useQuery({
    queryKey: CACHE_KEYS.BOM_EXPLODE(id),
    queryFn: () => explodeBom(id),
    enabled: showExplode,
  });

  const explodeColumns: ColumnDef<BomExplosionItem>[] = [
    {
      accessorKey: "level",
      header: "Level",
      cell: ({ row }) => (
        <span style={{ paddingLeft: `${(row.original.level - 1) * 20}px` }}>
          {row.original.level}
        </span>
      ),
    },
    { accessorKey: "product_sku", header: "SKU" },
    { accessorKey: "product_name", header: "Name" },
    { accessorKey: "qty_per_parent", header: "Qty/Parent" },
    { accessorKey: "total_quantity", header: "Total Qty" },
    {
      accessorKey: "unit_cost",
      header: "Unit Cost",
      cell: ({ row }) => row.original.unit_cost != null ? `$${Number(row.original.unit_cost).toFixed(2)}` : "—",
    },
  ];

  if (loadingBom) return <LoadingSpinner />;
  if (!bom) return <div className="flex items-center gap-2 text-muted-foreground"><AlertCircle className="h-5 w-5" /> BOM not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.MANUFACTURING_BOM)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{bom.name}</h2>
          <p className="text-muted-foreground text-sm">
            v{bom.version} — {bom.product.name} ({bom.product.sku})
          </p>
        </div>
        <Badge variant={bom.is_active ? "success" : "secondary"} className="ml-auto">
          {bom.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">BOM Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Output Quantity</span>
              <span>{bom.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span>{bom.version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Raw Materials</span>
              <span>{bom.items.length}</span>
            </div>
            {bom.notes && (
              <>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Notes</span>
                  <p className="mt-1">{bom.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Product</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{bom.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU</span>
              <span>{bom.product.sku}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowExplode(!showExplode)}>
            <LayoutList className="mr-2 h-4 w-4" />
            {showExplode ? "Simple View" : "Recursive Explosion"}
          </Button>
        </CardHeader>
        <CardContent>
          {showExplode ? (
            loadingExplode ? (
              <LoadingSpinner />
            ) : explosion && explosion.length > 0 ? (
              <DataTable
                columns={explodeColumns}
                data={explosion}
              />
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No explosion data</p>
            )
          ) : (
            <div className="space-y-2">
              {bom.items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No raw materials defined</p>
              ) : (
                bom.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">Qty: {item.quantity}</p>
                      {item.unit_cost != null && <p className="text-xs text-muted-foreground">${Number(item.unit_cost).toFixed(2)}/unit</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
