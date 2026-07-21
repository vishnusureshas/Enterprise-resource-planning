"use client";

import { useEffect } from "react";
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
  getCriterion, createCriterion, updateCriterion,
} from "@/modules/quality/quality.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";

const schema = z.object({
  productId: z.string().optional().nullable(),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  minValue: z.coerce.number().optional().nullable(),
  maxValue: z.coerce.number().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  isCritical: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  criterionId?: string;
}

export function CriterionFormModal({ open, onOpenChange, criterionId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!criterionId;

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100 }],
    queryFn: () => listProducts({ limit: 100 }),
    enabled: open,
  });

  const { data: criterion, isLoading: loadingCriterion } = useQuery({
    queryKey: CACHE_KEYS.QC_CRITERION(criterionId!),
    queryFn: () => getCriterion(criterionId!),
    enabled: isEdit && open,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { productId: null, name: "", description: "", minValue: null, maxValue: null, unit: "", isCritical: false, isActive: true },
  });

  useEffect(() => {
    if (criterion) {
      reset({
        productId: criterion.product_id || null,
        name: criterion.name,
        description: criterion.description || "",
        minValue: criterion.min_value ?? null,
        maxValue: criterion.max_value ?? null,
        unit: criterion.unit || "",
        isCritical: criterion.is_critical,
        isActive: criterion.is_active,
      });
    }
  }, [criterion, reset]);

  const createMutation = useMutation({
    mutationFn: createCriterion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_CRITERIA });
      toast({ title: "Criterion created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create criterion", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => updateCriterion(criterionId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_CRITERIA });
      toast({ title: "Criterion updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update criterion", variant: "destructive" }),
  });

  const onSubmit = (data: FormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Criterion" : "Add Inspection Criterion"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingCriterion ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name *</Label>
              <Input placeholder="Weight tolerance" className="h-9 text-sm" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Product</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                value={watch("productId") || ""}
                onChange={(e) => setValue("productId", e.target.value || null)}
              >
                <option value="">All products</option>
                {productsData?.data.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <textarea
                className="flex min-h-[52px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                {...register("description")}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Min</Label>
                <Input type="number" step="any" className="h-9 text-sm" {...register("minValue")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Max</Label>
                <Input type="number" step="any" className="h-9 text-sm" {...register("maxValue")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Unit</Label>
                <Input placeholder="g, mm" className="h-9 text-sm" {...register("unit")} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch id="isCritical" checked={watch("isCritical")} onCheckedChange={(c) => setValue("isCritical", c)} />
                <Label htmlFor="isCritical" className="text-xs font-medium">Critical</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                <Label htmlFor="isActive" className="text-xs font-medium">Active</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} Criterion
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
