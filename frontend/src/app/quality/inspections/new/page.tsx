"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { createInspection, listChecklists, getReferenceLabel, listReferenceItems, getReferenceItemLabel } from "@/modules/quality/quality.api";
import type { ReferenceItem } from "@/modules/quality/quality.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, ClipboardCheck } from "lucide-react";

const REF_TYPES = [
  { value: "purchase_order_item", label: "Purchase Order Item" },
  { value: "work_order_output", label: "Manufacturing Output" },
  { value: "sales_order_item", label: "Sales Order Item" },
];

export default function NewInspectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [checklistId, setChecklistId] = useState("");
  const [referenceType, setReferenceType] = useState("purchase_order_item");
  const [referenceId, setReferenceId] = useState("");
  const [notes, setNotes] = useState("");

  const { data: checklistsData } = useQuery({
    queryKey: [...CACHE_KEYS.QC_CHECKLISTS, { limit: 100 }],
    queryFn: () => listChecklists({ limit: 100 }),
  });

  const { data: referenceItems = [] } = useQuery({
    queryKey: CACHE_KEYS.QC_REFERENCE_ITEMS(referenceType),
    queryFn: () => listReferenceItems(referenceType),
    enabled: !!referenceType,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createInspection({
        checklistId: checklistId || null,
        referenceType,
        referenceId,
        notes: notes || null,
      }),
    onSuccess: (insp) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_INSPECTIONS });
      toast({ title: "Inspection created", variant: "success" });
      router.push(ROUTES.QUALITY_INSPECTION_DETAIL(insp.id));
    },
    onError: (err: unknown) => {
      const errorData = (err as { response?: { data?: { error?: { message?: string; details?: Array<{ field: string; message: string }> } } } })?.response?.data?.error;
      const msg = errorData?.message || "Failed to create inspection";
      const details = errorData?.details?.map((d) => `${d.field}: ${d.message}`).join("; ") || "";
      toast({ title: msg, description: details || undefined, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.QUALITY_INSPECTIONS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Inspection</h2>
          <p className="text-muted-foreground text-sm">Create a quality inspection</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Source Type *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={referenceType}
                  onChange={(e) => setReferenceType(e.target.value)}
                >
                  {REF_TYPES.map((rt) => (
                    <option key={rt.value} value={rt.value}>{rt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Source Item *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                >
                  <option value="">Select a {getReferenceLabel(referenceType).toLowerCase()}...</option>
                  {referenceItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {getReferenceItemLabel(item, referenceType)}
                    </option>
                  ))}
                </select>
                {referenceItems.length === 0 && (
                  <p className="text-[10px] text-muted-foreground">
                    No {getReferenceLabel(referenceType).toLowerCase()} items available. Create one in the source module first.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Checklist</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={checklistId}
                  onChange={(e) => setChecklistId(e.target.value)}
                >
                  <option value="">No checklist</option>
                  {checklistsData?.data.filter((c) => c.is_active).map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.items.length} checks)</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Inspection notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>{getReferenceLabel(referenceType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Checklist</span>
                <span>{checklistsData?.data.find((c) => c.id === checklistId)?.name || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full" size="lg"
            disabled={!referenceId || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating..." : "Create Inspection"}
          </Button>
        </div>
      </div>
    </div>
  );
}
