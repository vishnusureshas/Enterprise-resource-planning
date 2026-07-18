"use client";

import { useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import {
  getProduct,
  createProduct,
  updateProduct,
  listCategories,
  type Product,
} from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Tag, DollarSign, Package, Grip } from "lucide-react";

const productSchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100),
  name: z.string().min(1, "Name is required").max(255),
  categoryId: z.string().optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  unitOfMeasure: z.string().max(50).optional().default("pcs"),
  unitPrice: z.coerce.number().min(0).optional().default(0),
  costPrice: z.coerce.number().min(0).optional().default(0),
  reorderPoint: z.coerce.number().min(0).optional().default(0),
  reorderQuantity: z.coerce.number().min(0).optional().default(0),
  weight: z.coerce.number().min(0).optional().nullable(),
  weightUnit: z.string().max(10).optional().default("kg"),
  isActive: z.boolean().optional().default(true),
  trackInventory: z.boolean().optional().default(true),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string;
}

export function ProductFormModal({ open, onOpenChange, productId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!productId;

  const { data: categories } = useQuery({
    queryKey: [...CACHE_KEYS.CATEGORIES, { limit: 100 }],
    queryFn: () => listCategories({ limit: 100 }),
    enabled: open,
  });

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: CACHE_KEYS.INVENTORY_ITEM(productId!),
    queryFn: () => getProduct(productId!),
    enabled: isEdit && open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "", name: "", categoryId: null, description: "",
      unitOfMeasure: "pcs", unitPrice: 0, costPrice: 0,
      reorderPoint: 0, reorderQuantity: 0, weight: null, weightUnit: "kg",
      isActive: true, trackInventory: true,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        sku: product.sku,
        name: product.name,
        categoryId: product.category_id || null,
        description: product.description || "",
        unitOfMeasure: product.unit_of_measure,
        unitPrice: product.unit_price,
        costPrice: product.cost_price,
        reorderPoint: product.reorder_point,
        reorderQuantity: product.reorder_quantity,
        weight: product.weight || null,
        weightUnit: product.weight_unit,
        isActive: product.is_active,
        trackInventory: product.track_inventory,
      });
    }
  }, [product, reset]);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVENTORY_ITEMS });
      toast({ title: "Product created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create product", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormValues) => updateProduct(productId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.INVENTORY_ITEMS });
      toast({ title: "Product updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
  });

  const onSubmit = (data: ProductFormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingProduct ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Identity Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Identification</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU *</Label>
                  <Input id="sku" placeholder="SKU-001" {...register("sku")} />
                  {errors.sku && <p className="text-sm text-destructive">{errors.sku.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" placeholder="Widget Pro" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Category</Label>
                  <select
                    id="categoryId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={watch("categoryId") || ""}
                    onChange={(e) => setValue("categoryId", e.target.value || null)}
                  >
                    <option value="">No category</option>
                    {categories?.data.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                  <Input id="unitOfMeasure" placeholder="pcs" {...register("unitOfMeasure")} />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Pricing</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unitPrice">Unit Price ($)</Label>
                  <Input id="unitPrice" type="number" step="0.01" placeholder="0.00" {...register("unitPrice")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price ($)</Label>
                  <Input id="costPrice" type="number" step="0.01" placeholder="0.00" {...register("costPrice")} />
                </div>
              </div>
            </div>

            {/* Inventory Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Inventory</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reorderPoint">Reorder Point</Label>
                  <Input id="reorderPoint" type="number" placeholder="0" {...register("reorderPoint")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderQuantity">Reorder Quantity</Label>
                  <Input id="reorderQuantity" type="number" placeholder="0" {...register("reorderQuantity")} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="trackInventory" checked={watch("trackInventory")} onCheckedChange={(c) => setValue("trackInventory", c)} />
                  <Label htmlFor="trackInventory">Track Inventory</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} Product
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
