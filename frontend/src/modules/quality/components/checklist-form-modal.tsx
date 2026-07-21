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
  items: z.array(itemSchema).min(1, "At least one check required"),
});

type FormValues = z.infer<typeof schema>;

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
    defaultValues: { name: "", description: "", isActive: true, items: [] },
  });

  useEffect(() => {
    if (checklist) {
      reset({
        name: checklist.name,
        description: checklist.description || "",
        isActive: checklist.is_active,
        items: checklist.items.map((i) => ({
          description: i.description,
          expectedValue: i.expected_value || null,
          minValue: i.min_value ?? null,
          maxValue: i.max_value ?? null,
          unit: i.unit || null,
          isCritical: i.is_critical,
          inspectionMethod: i.inspection_method || null,
        })),
      });
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

  const [items, setItems] = useState<FormValues["items"]>([]);

  useEffect(() => { if (!isEdit) setItems([]); }, [open, isEdit]);

  const addItem = () => {
    setItems((prev) => [...prev, { description: "", expectedValue: null, minValue: null, maxValue: null, unit: null, isCritical: false, inspectionMethod: null }]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: string, value: unknown) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => createChecklist({ ...data, items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_CHECKLISTS });
      toast({ title: "Checklist created", variant: "success" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "Failed to create checklist", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) => updateChecklist(checklistId!, { ...data, items }),
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
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Checklist" : "Add QC Checklist"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingChecklist ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</h4>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Name *</Label>
                <Input placeholder="Widget Inspection" className="h-9 text-sm" {...register("name")} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Description</Label>
                <textarea
                  className="flex min-h-[52px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  {...register("description")}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch id="isActive" checked={watch("isActive")} onCheckedChange={(c) => setValue("isActive", c)} />
                <Label htmlFor="isActive" className="text-xs font-medium">Active</Label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Checklist Items</h4>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addItem}>
                  <Plus className="mr-1 h-3 w-3" /> Add Check
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">Click "Add Check" to create inspection items</p>
              ) : (
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {items.map((item, idx) => (
                    <div key={idx} className="rounded-md border p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1.5">
                          <Label className="text-xs font-medium">Description *</Label>
                          <Input
                            className="h-8 text-sm"
                            value={item.description}
                            onChange={(e) => updateItem(idx, "description", e.target.value)}
                            placeholder="e.g. Weight within tolerance"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 mt-5 shrink-0" onClick={() => removeItem(idx)} type="button">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium">Expected</Label>
                          <Input className="h-7 text-xs" value={item.expectedValue ?? ""}
                            onChange={(e) => updateItem(idx, "expectedValue", e.target.value || null)}
                            placeholder="Blue RAL 5015" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium">Min</Label>
                          <Input type="number" className="h-7 text-xs" value={item.minValue ?? ""}
                            onChange={(e) => updateItem(idx, "minValue", e.target.value ? parseFloat(e.target.value) : null)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium">Max</Label>
                          <Input type="number" className="h-7 text-xs" value={item.maxValue ?? ""}
                            onChange={(e) => updateItem(idx, "maxValue", e.target.value ? parseFloat(e.target.value) : null)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium">Unit</Label>
                          <Input className="h-7 text-xs" value={item.unit ?? ""}
                            onChange={(e) => updateItem(idx, "unit", e.target.value || null)}
                            placeholder="g, mm" />
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <input type="checkbox" id={`critical-${idx}`} checked={item.isCritical}
                            onChange={(e) => updateItem(idx, "isCritical", e.target.checked)}
                            className="h-3.5 w-3.5 rounded border-gray-300" />
                          <Label htmlFor={`critical-${idx}`} className="text-[10px] font-medium">Critical</Label>
                        </div>
                        <div className="flex-1" />
                        <div className="w-40">
                          <Input className="h-7 text-xs" value={item.inspectionMethod ?? ""}
                            onChange={(e) => updateItem(idx, "inspectionMethod", e.target.value || null)}
                            placeholder="Method: Caliper" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" size="sm" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                {isEdit ? "Update" : "Create"} Checklist
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
