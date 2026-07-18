"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  transferStock,
  listWarehouses,
  type StockItem,
} from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";

const transferSchema = z.object({
  toWarehouseId: z.string().min(1, "Destination warehouse is required"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  notes: z.string().max(1000).optional().nullable(),
});

type TransferFormValues = z.infer<typeof transferSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem: StockItem | null;
}

export function TransferStockModal({ open, onOpenChange, stockItem }: Props) {
  const queryClient = useQueryClient();

  const { data: warehouses } = useQuery({
    queryKey: [...CACHE_KEYS.WAREHOUSES, { limit: 100 }],
    queryFn: () => listWarehouses({ limit: 100 }),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: { toWarehouseId: "", quantity: 1, notes: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: TransferFormValues) =>
      transferStock({
        fromWarehouseId: stockItem!.warehouse_id,
        toWarehouseId: data.toWarehouseId,
        productId: stockItem!.product_id,
        variantId: null,
        quantity: data.quantity,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.STOCK });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MOVEMENTS });
      toast({ title: "Stock transferred", variant: "success" });
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to transfer stock", variant: "destructive" });
    },
  });

  const onSubmit = (data: TransferFormValues) => mutation.mutate(data);

  const available = stockItem ? stockItem.quantity - stockItem.reserved_quantity : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Stock</DialogTitle>
        </DialogHeader>

        {stockItem && (
          <div className="text-sm text-muted-foreground mb-2">
            Transferring: <strong>{stockItem.product.name}</strong> (SKU: {stockItem.product.sku})<br />
            From: <strong>{stockItem.warehouse.name}</strong> — Available: <strong>{available}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="toWarehouse">Destination Warehouse *</Label>
            <select
              id="toWarehouse"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={watch("toWarehouseId")}
              onChange={(e) => setValue("toWarehouseId", e.target.value)}
            >
              <option value="">Select warehouse...</option>
              {(warehouses?.data || [])
                .filter((wh) => wh.id !== stockItem?.warehouse_id)
                .map((wh) => (
                  <option key={wh.id} value={wh.id}>{wh.name} ({wh.code})</option>
                ))}
            </select>
            {errors.toWarehouseId && <p className="text-sm text-destructive">{errors.toWarehouseId.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="qty">Quantity *</Label>
            <Input id="qty" type="number" min="1" max={available} {...register("quantity")} />
            {errors.quantity && <p className="text-sm text-destructive">{errors.quantity.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register("notes")} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>Transfer</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
