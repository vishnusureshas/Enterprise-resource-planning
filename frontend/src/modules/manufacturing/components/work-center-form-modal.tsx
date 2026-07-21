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
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import {
  getWorkCenter, createWorkCenter, updateWorkCenter,
  type WorkCenter,
} from "@/modules/manufacturing/manufacturing.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Wrench, Info } from "lucide-react";

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Work Center" : "Add Work Center"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingCenter ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">Details</h4>
              </div>
              <Separator className="mb-4" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input id="name" placeholder="Assembly Line A" {...register("name")} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Input id="code" placeholder="AL-A" {...register("code")} />
                  {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...register("description")}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacityPerShift">Capacity Per Shift</Label>
                  <Input id="capacityPerShift" type="number" min={1} {...register("capacityPerShift")} />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} Work Center
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
