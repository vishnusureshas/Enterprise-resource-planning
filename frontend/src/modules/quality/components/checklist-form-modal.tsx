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
  getChecklist, createChecklist, updateChecklist,
} from "@/modules/quality/quality.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Plus, Trash2 } from "lucide-react";

const itemSchema = z.object({
  description: z.string().min(1, "Required").max(1000),
  expectedValue: z.string().max(500).optional().nullable(),
  minValue: z.coerce.number().optional().nullable(),
  maxValue: z.coerce.number().optional().nullable(),
  unit: z.string().max(50).optional().nullable(),
  isCritical: z.boolean().default(false),
  inspectionMethod: z.string().max(100).optional().nullable(),
});

const schema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;
type ItemValues = {
  description: string;
  expectedValue: string | null;
  minValue: number | null;
  maxValue: number | null;
  unit: string | null;
  isCritical: boolean;
  inspectionMethod: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checklistId?: string;
}

export function ChecklistFormModal({ open, onOpenChange, checklistId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!checklistId;

  const { data: checklist, isLoading: loadingChecklist } = useQuery({
    queryKey: CACHE_KEYS.QC_CHECKLIST(checklistId!),
    queryFn: () => getChecklist(checklistId!),
    enabled: isEdit && open,
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", isActive: true },
  });

  const [items, setItems] = useState<ItemValues[]>([]);

  useEffect(() => { if (!isEdit) setItems([]); }, [open, isEdit]);

  useEffect(() => {
    if (checklist) {
      reset({ name: checklist.name, description: checklist.description || "", isActive: checklist.is_active } as FormValues);
      setItems(checklist.items.map((i) => ({
        description: i.description,
        expectedValue: i.expected_value || null,
        minValue: i.min_value ?? null,
        maxValue: i.max_value ?? null,
        unit: i.unit || null,
        isCritical: i.is_critical,
        inspectionMethod: i.inspection_method || null,
      })));
    }
  }, [checklist, reset]);

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", expectedValue: null, minValue: null, maxValue: null, unit: null, isCritical: false, inspectionMethod: null }]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const createMutation = useMutation({
    mutationFn: (data: FormValues & { items: ItemValues[] }) => createChecklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_CHECKLISTS });
      toast({ title: "Checklist created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create checklist", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues & { items: ItemValues[] }) => updateChecklist(checklistId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_CHECKLISTS });
      toast({ title: "Checklist updated", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to update checklist", variant: "destructive" }),
  });

  const onSubmit = (data: FormValues) => {
    if (items.length === 0) {
      toast({ title: "Please add at least one checklist item", variant: "destructive" });
      return;
    }
    const payload = { ...data, items };
    if (isEdit) updateMutation.mutate(payload as FormValues & { items: ItemValues[] });
    else createMutation.mutate(payload as FormValues & { items: ItemValues[] });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Checklist" : "Add QC Checklist"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingChecklist ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name *</Label>
                <Input placeholder="Widget Inspection" className="h-8 text-sm" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <textarea
                  className="flex min-h-[44px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  {...register("description")}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                <Label htmlFor="isActive" className="text-xs font-medium">Active</Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</h4>
                <Button type="button" variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={addItem}>
                  <Plus className="mr-0.5 h-2.5 w-2.5" /> Add Check
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Click "Add Check" to create inspection items</p>
              ) : (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded border p-2 space-y-1.5">
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex-1 min-w-0">
                          <Label className="text-[10px] font-medium">Description *</Label>
                          <Input
                            className="h-7 text-xs mt-0.5"
                            value={item.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                            placeholder="e.g. Weight tolerance"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 mt-4 shrink-0" onClick={() => removeItem(idx)} type="button">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <div>
                          <Label className="text-[10px] font-medium">Expected</Label>
                          <Input className="h-6 text-[10px] mt-0.5" value={item.expectedValue ?? ""}
                            onChange={(e) => updateItem(idx, "expectedValue", e.target.value || null)}
                            placeholder="Value" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-medium">Min</Label>
                          <Input type="number" step="any" className="h-6 text-[10px] mt-0.5" value={item.minValue ?? ""}
                            onChange={(e) => updateItem(idx, "minValue", e.target.value ? parseFloat(e.target.value) : null)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-medium">Max</Label>
                          <Input type="number" step="any" className="h-6 text-[10px] mt-0.5" value={item.maxValue ?? ""}
                            onChange={(e) => updateItem(idx, "maxValue", e.target.value ? parseFloat(e.target.value) : null)} />
                        </div>
                        <div>
                          <Label className="text-[10px] font-medium">Unit</Label>
                          <Input className="h-6 text-[10px] mt-0.5" value={item.unit ?? ""}
                            onChange={(e) => updateItem(idx, "unit", e.target.value || null)}
                            placeholder="g, mm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <input type="checkbox" id={`critical-${idx}`} checked={item.isCritical}
                            onChange={(e) => updateItem(idx, "isCritical", e.target.checked)}
                            className="h-3 w-3 rounded border-gray-300" />
                          <Label htmlFor={`critical-${idx}`} className="text-[10px] font-medium">Critical</Label>
                        </div>
                        <div className="flex-1" />
                        <div className="w-32">
                          <Input className="h-6 text-[10px]" value={item.inspectionMethod ?? ""}
                            onChange={(e) => updateItem(idx, "inspectionMethod", e.target.value || null)}
                            placeholder="Method" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="h-8 text-xs" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
