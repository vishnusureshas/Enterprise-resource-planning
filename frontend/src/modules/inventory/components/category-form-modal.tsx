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
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import {
  getCategory,
  createCategory,
  updateCategory,
  listCategories,
} from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Must be lowercase alphanumeric with dashes"),
  parentId: z.string().optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
}

export function CategoryFormModal({ open, onOpenChange, categoryId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!categoryId;

  const { data: categories } = useQuery({
    queryKey: [...CACHE_KEYS.CATEGORIES, { limit: 100 }],
    queryFn: () => listCategories({ limit: 100 }),
    enabled: open,
  });

  const { data: category, isLoading: loading } = useQuery({
    queryKey: CACHE_KEYS.CATEGORY(categoryId!),
    queryFn: () => getCategory(categoryId!),
    enabled: isEdit && open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", parentId: null, description: "", isActive: true, sortOrder: 0 },
  });

  useEffect(() => {
    if (category) {
      reset({
        name: category.name,
        slug: category.slug,
        parentId: category.parent_id || null,
        description: category.description || "",
        isActive: category.is_active,
        sortOrder: category.sort_order,
      });
    }
  }, [category, reset]);

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CATEGORIES });
      toast({ title: "Category created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CategoryFormValues) => updateCategory(categoryId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CATEGORIES });
      toast({ title: "Category updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const onSubmit = (data: CategoryFormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "Add Category"}</DialogTitle>
        </DialogHeader>

        {isEdit && loading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Name *</Label>
              <Input id="cat-name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-slug">Slug *</Label>
              <Input id="cat-slug" {...register("slug")} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-parent">Parent Category</Label>
              <select
                id="cat-parent"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={watch("parentId") || ""}
                onChange={(e) => setValue("parentId", e.target.value || null)}
              >
                <option value="">None (top level)</option>
                {(categories?.data || []).filter((c) => c.id !== categoryId).map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Description</Label>
              <Input id="cat-desc" {...register("description")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-sort">Sort Order</Label>
                <Input id="cat-sort" type="number" {...register("sortOrder")} />
              </div>
              <div className="flex items-end gap-2 pb-2">
                <Switch id="cat-active" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                <Label htmlFor="cat-active">Active</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} Category
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
