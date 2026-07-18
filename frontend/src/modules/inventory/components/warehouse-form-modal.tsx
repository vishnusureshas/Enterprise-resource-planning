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
  getWarehouse,
  createWarehouse,
  updateWarehouse,
} from "@/modules/inventory/inventory.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Building2, MapPin, ToggleLeft } from "lucide-react";

const warehouseSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().default("US"),
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
});

type WarehouseFormValues = z.infer<typeof warehouseSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId?: string;
}

export function WarehouseFormModal({ open, onOpenChange, warehouseId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!warehouseId;

  const { data: warehouse, isLoading: loading } = useQuery({
    queryKey: CACHE_KEYS.WAREHOUSE(warehouseId!),
    queryFn: () => getWarehouse(warehouseId!),
    enabled: isEdit && open,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: "", name: "", description: "",
      addressLine1: "", addressLine2: "",
      city: "", state: "", postalCode: "", country: "US",
      isActive: true, isDefault: false,
    },
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        code: warehouse.code,
        name: warehouse.name,
        description: warehouse.description || "",
        addressLine1: warehouse.address_line1 || "",
        addressLine2: warehouse.address_line2 || "",
        city: warehouse.city || "",
        state: warehouse.state || "",
        postalCode: warehouse.postal_code || "",
        country: warehouse.country,
        isActive: warehouse.is_active,
        isDefault: warehouse.is_default,
      });
    }
  }, [warehouse, reset]);

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WAREHOUSES });
      toast({ title: "Warehouse created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create warehouse", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: WarehouseFormValues) => updateWarehouse(warehouseId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WAREHOUSES });
      toast({ title: "Warehouse updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update warehouse", variant: "destructive" }),
  });

  const onSubmit = (data: WarehouseFormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
        </DialogHeader>

        {isEdit && loading ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Identity Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Identity</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wh-code">Code *</Label>
                  <Input id="wh-code" placeholder="WH-MAIN" {...register("code")} />
                  {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-name">Name *</Label>
                  <Input id="wh-name" placeholder="Main Warehouse" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Address</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="wh-addr1">Address Line 1</Label>
                  <Input id="wh-addr1" placeholder="123 Business Ave" {...register("addressLine1")} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="wh-addr2">Address Line 2</Label>
                  <Input id="wh-addr2" placeholder="Suite 100" {...register("addressLine2")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-city">City</Label>
                  <Input id="wh-city" placeholder="New York" {...register("city")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-state">State</Label>
                  <Input id="wh-state" placeholder="NY" {...register("state")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wh-zip">Postal Code</Label>
                  <Input id="wh-zip" placeholder="10001" {...register("postalCode")} />
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
              </div>
              <Separator className="mb-4" />
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="wh-active" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                  <Label htmlFor="wh-active">Active</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="wh-default" checked={watch("isDefault")} onCheckedChange={(c) => setValue("isDefault", c)} />
                  <Label htmlFor="wh-default">Default Warehouse</Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} Warehouse
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
