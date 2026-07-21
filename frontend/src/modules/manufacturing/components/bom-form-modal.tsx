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
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import {
  getBom, createBom, updateBom,
} from "@/modules/manufacturing/manufacturing.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Plus, Trash2 } from "lucide-react";

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
      setItems(bom.items.map((i) => ({
        productId: i.product_id,
        quantity: i.quantity,
        unitCost: i.unit_cost ?? null,
        sequence: i.sequence,
        notes: i.notes || null,
      })));
    }
  }, [bom, reset]);

  const [items, setItems] = useState<FormValues["items"]>([]);

  useEffect(() => {
    if (!isEdit) {
      setItems([]);
    }
  }, [open, isEdit]);

  const addItem = (productId: string) => {
    setItems((prev) => [...prev, { productId, quantity: 1, unitCost: null, sequence: prev.length, notes: null }]);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit BOM" : "Add Bill of Materials"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingBom ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Header</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="productId" className="text-xs font-medium">Finished Product *</Label>
                  <select
                    id="productId"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={watch("productId")}
                    onChange={(e) => setValue("productId", e.target.value)}
                  >
                    <option value="">Select...</option>
                    {products.filter((p) => p.is_active).map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                  {errors.productId && <p className="text-xs text-destructive">{errors.productId.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">BOM Name *</Label>
                  <Input id="name" placeholder="Widget BOM" className="h-9 text-sm" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="version" className="text-xs font-medium">Version</Label>
                  <Input id="version" type="number" min={1} className="h-9 text-sm" {...register("version")} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantity" className="text-xs font-medium">Output Qty</Label>
                  <Input id="quantity" type="number" min={0.0001} step={1} className="h-9 text-sm" {...register("quantity")} />
                </div>
                <div className="flex items-end pb-0.5">
                  <div className="flex items-center gap-2">
                    <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                    <Label htmlFor="isActive" className="text-xs font-medium">Active</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-xs font-medium">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[52px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  {...register("notes")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Raw Materials</h4>
                <Input
                  placeholder="Search..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="max-w-[140px] h-7 text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {products.filter((p) => p.is_active).slice(0, 8).map((p) => (
                  <Button
                    key={p.id}
                    variant="outline" size="sm" className="h-7 text-xs px-2"
                    onClick={() => addItem(p.id)}
                    type="button"
                  >
                    <Plus className="mr-1 h-3 w-3" />{p.sku}
                  </Button>
                ))}
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Click a product above to add as raw material</p>
              ) : (
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {items.map((item, idx) => {
                    const prod = products.find((p) => p.id === item.productId);
                    return (
                      <div key={idx} className="flex items-center gap-2 rounded-md border px-2.5 py-1.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{prod?.name || "Unknown"}</p>
                          <p className="text-[10px] text-muted-foreground">{prod?.sku || ""}</p>
                        </div>
                        <div className="w-14">
                          <Input type="number" min={0.0001} step="any" value={item.quantity}
                            onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs text-center" />
                        </div>
                        <div className="w-16">
                          <Input type="number" min={0} step={0.01} value={item.unitCost ?? ""}
                            onChange={(e) => updateItem(idx, "unitCost", e.target.value ? parseFloat(e.target.value) : null)}
                            className="h-7 text-xs text-center" placeholder="Cost" />
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeItem(idx)} type="button">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              {errors.items && <p className="text-xs text-destructive">{errors.items.message}</p>}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} BOM
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
