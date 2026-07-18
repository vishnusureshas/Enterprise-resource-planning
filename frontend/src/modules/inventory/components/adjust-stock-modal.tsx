"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  adjustStock,
  type StockItem,
} from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";

const adjustSchema = z.object({
  newQuantity: z.coerce.number().min(0, "Quantity cannot be negative"),
  reason: z.string().min(1, "Reason is required").max(500),
});

type AdjustFormValues = z.infer<typeof adjustSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItem: StockItem | null;
}

export function AdjustStockModal({ open, onOpenChange, stockItem }: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: { newQuantity: 0, reason: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: AdjustFormValues) =>
      adjustStock({
        warehouseId: stockItem!.warehouse_id,
        productId: stockItem!.product_id,
        variantId: null,
        newQuantity: data.newQuantity,
        reason: data.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.STOCK });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.MOVEMENTS });
      toast({ title: "Stock adjusted", variant: "success" });
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast({ title: "Failed to adjust stock", variant: "destructive" });
    },
  });

  const onSubmit = (data: AdjustFormValues) => mutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>

        {stockItem && (
          <div className="text-sm text-muted-foreground mb-2">
            Product: <strong>{stockItem.product.name}</strong> (SKU: {stockItem.product.sku})<br />
            Warehouse: <strong>{stockItem.warehouse.name}</strong><br />
            Current Quantity: <strong>{stockItem.quantity}</strong>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newQty">New Quantity *</Label>
            <Input id="newQty" type="number" min="0" step="1" {...register("newQuantity")} />
            {errors.newQuantity && <p className="text-sm text-destructive">{errors.newQuantity.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Input id="reason" {...register("reason")} />
            {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>Adjust</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
