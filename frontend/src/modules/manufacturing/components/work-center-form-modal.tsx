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
  getWorkCenter, createWorkCenter, updateWorkCenter,
} from "@/modules/manufacturing/manufacturing.api";
import { CACHE_KEYS } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  code: z.string().min(1, "Code is required").max(100),
  description: z.string().max(1000).optional().nullable(),
  capacityPerShift: z.coerce.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  centerId?: string;
}

export function WorkCenterFormModal({ open, onOpenChange, centerId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!centerId;

  const { data: center, isLoading: loadingCenter } = useQuery({
    queryKey: CACHE_KEYS.WORK_CENTER(centerId!),
    queryFn: () => getWorkCenter(centerId!),
    enabled: isEdit && open,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", code: "", description: "", capacityPerShift: 1, isActive: true },
  });

  useEffect(() => {
    if (center) {
      reset({
        name: center.name,
        code: center.code,
        description: center.description || "",
        capacityPerShift: center.capacity_per_shift,
        isActive: center.is_active,
      });
    }
  }, [center, reset]);

  const createMutation = useMutation({
    mutationFn: createWorkCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WORK_CENTERS });
      toast({ title: "Work center created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create work center", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => updateWorkCenter(centerId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WORK_CENTERS });
      toast({ title: "Work center updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update work center", variant: "destructive" }),
  });

  const onSubmit = (data: FormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Work Center" : "Add Work Center"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingCenter ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium">Name *</Label>
                  <Input id="name" placeholder="Assembly Line A" className="h-9 text-sm" {...register("name")} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="code" className="text-xs font-medium">Code *</Label>
                  <Input id="code" placeholder="AL-A" className="h-9 text-sm" {...register("code")} />
                  {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-xs font-medium">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  {...register("description")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="capacityPerShift" className="text-xs font-medium">Capacity / Shift</Label>
                  <Input id="capacityPerShift" type="number" min={1} className="h-9 text-sm" {...register("capacityPerShift")} />
                </div>
                <div className="flex items-end pb-0.5">
                  <div className="flex items-center gap-2">
                    <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                    <Label htmlFor="isActive" className="text-xs font-medium">Active</Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
