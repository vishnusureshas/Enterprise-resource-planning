"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import {
  getBom, createBom, updateBom,
  type Bom,
} from "@/modules/manufacturing/manufacturing.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Trash2 } from "lucide-react";

const itemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.coerce.number().positive("Qty must be positive"),
  unitCost: z.coerce.number().min(0).optional().nullable(),
  sequence: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(500).optional().nullable(),
});

const schema = z.object({
  productId: z.string().min(1, "Product is required"),
  name: z.string().min(1, "Name is required").max(255),
  version: z.coerce.number().int().min(1).default(1),
  quantity: z.coerce.number().positive().default(1),
  isActive: z.boolean().default(true),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(itemSchema).min(1, "At least one item required"),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bomId?: string;
}

export function BomFormModal({ open, onOpenChange, bomId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!bomId;
  const [productSearch, setProductSearch] = useState("");

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100, search: productSearch || undefined }],
    queryFn: () => listProducts({ limit: 100, search: productSearch || undefined }),
    enabled: open,
  });

  const products = productsData?.data || [];

  const { data: bom, isLoading: loadingBom } = useQuery({
    queryKey: CACHE_KEYS.BOM(bomId!),
    queryFn: () => getBom(bomId!),
    enabled: isEdit && open,
  });

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      productId: "", name: "", version: 1, quantity: 1,
      isActive: true, notes: "", items: [],
    },
  });

  useEffect(() => {
    if (bom) {
      reset({
        productId: bom.product_id,
        name: bom.name,
        version: bom.version,
        quantity: bom.quantity,
        isActive: bom.is_active,
        notes: bom.notes || "",
        items: bom.items.map((i) => ({
          productId: i.product_id,
          quantity: i.quantity,
          unitCost: i.unit_cost ?? null,
          sequence: i.sequence,
          notes: i.notes || null,
        })),
      });
    }
  }, [bom, reset]);

  const [items, setItems] = useState<FormValues["items"]>([]);

  useEffect(() => {
    if (!isEdit) {
      setItems([]);
    }
  }, [open, isEdit]);

  const addItem = (item: { productId: string; productName: string }) => {
    setItems((prev) => [...prev, { productId: item.productId, quantity: 1, unitCost: null, sequence: prev.length, notes: null }]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createBom({ ...data, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.BOMS });
      toast({ title: "BOM created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create BOM", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => updateBom(bomId!, { ...data, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.BOMS });
      toast({ title: "BOM updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update BOM", variant: "destructive" }),
  });

  const onSubmit = (data: FormValues) => {
    const payload = { ...data, items };
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit BOM" : "Add Bill of Materials"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingBom ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Header</h4>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productId">Finished Product *</Label>
                  <select
                    id="productId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={watch("productId")}
                    onChange={(e) => setValue("productId", e.target.value)}
                  >
                    <option value="">Select product...</option>
                    {products.filter((p) => p.is_active).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  {errors.productId && <p className="text-sm text-destructive">{errors.productId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">BOM Name *</Label>
                  <Input id="name" placeholder="BOM for Widget" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Input id="version" type="number" min={1} {...register("version")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Output Quantity</Label>
                  <Input id="quantity" type="number" min={0.0001} step={1} {...register("quantity")} />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("notes")}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-muted-foreground">Raw Materials</h4>
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="max-w-[200px] h-8 text-sm"
                />
              </div>
              <Separator className="mb-4" />
              <div className="flex flex-wrap gap-1 mb-3">
                {products.filter((p) => p.is_active).slice(0, 10).map((p) => (
                  <Button
                    key={p.id}
                    variant="outline" size="sm" className="text-xs"
                    onClick={() => addItem({ productId: p.id, productName: p.name })}
                  >
                    {p.sku}
                  </Button>
                ))}
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Click a product above to add as raw material</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-end gap-2 rounded-lg border p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{prod?.name || item.productId}</p>
                          <p className="text-xs text-muted-foreground">{prod?.sku || ""}</p>
                        </div>
                        <div className="w-20">
                          <Label className="text-xs">Qty</Label>
                          <Input type="number" min={0.0001} step="any" value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-8 text-sm" />
                        </div>
                        <div className="w-20">
                          <Label className="text-xs">Unit Cost</Label>
                          <Input type="number" min={0} step={0.01} value={item.unitCost ?? ""}
                            onChange={(e) => updateItem(idx, "unitCost", e.target.value ? parseFloat(e.target.value) : null)}
                            className="h-8 text-sm" />
                        </div>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(idx)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.items && <p className="text-sm text-destructive mt-1">{errors.items.message}</p>}
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} BOM
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
