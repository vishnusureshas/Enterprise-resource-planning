"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  getInspection, deleteInspection, getChecklist,
  getInspectionStatusLabel, getInspectionStatusColor, getReferenceLabel,
  recordResults, updateInspectionStatus,
  type Inspection, type RecordResultsPayload,
} from "@/modules/quality/quality.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, Trash2, ClipboardCheck, Play } from "lucide-react";

interface ResultFormEntry {
  checklistItemId: string | null;
  itemDescription: string;
  isPass: boolean;
  actualValue: string;
  actualNumeric: string;
  notes: string;
  isCritical: boolean;
}

export default function InspectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [finalStatus, setFinalStatus] = useState<string>("passed");
  const [finalSummary, setFinalSummary] = useState<string>("pass");
  const [notes, setNotes] = useState("");

  const { data: inspection, isLoading, isError } = useQuery({
    queryKey: CACHE_KEYS.QC_INSPECTION(id),
    queryFn: () => getInspection(id),
    enabled: !!id,
  });

  const { data: checklistDetail } = useQuery({
    queryKey: CACHE_KEYS.QC_CHECKLIST(inspection?.checklist_id ?? ""),
    queryFn: () => getChecklist(inspection!.checklist_id!),
    enabled: !!inspection?.checklist_id,
  });

  const checklistItems = checklistDetail?.items ?? [];

  const [results, setResults] = useState<ResultFormEntry[]>([]);

  const isEditable = inspection && (inspection.status === "pending" || inspection.status === "in_progress");

  const startMutation = useMutation({
    mutationFn: () => updateInspectionStatus(id, "in_progress"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_INSPECTION(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_INSPECTIONS });
      toast({ title: "Inspection started", variant: "success" });
    },
    onError: () => toast({ title: "Failed to start inspection", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInspection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_INSPECTIONS });
      toast({ title: "Inspection deleted", variant: "success" });
      router.push(ROUTES.QUALITY_INSPECTIONS);
    },
    onError: () => toast({ title: "Failed to delete inspection", variant: "destructive" }),
  });

  const recordMutation = useMutation({
    mutationFn: (data: RecordResultsPayload) => recordResults(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_INSPECTION(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_INSPECTIONS });
      toast({ title: "Results recorded", variant: "success" });
    },
    onError: (err: unknown) => {
      const errorData = (err as { response?: { data?: { error?: { message?: string; details?: Array<{ field: string; message: string }> } } } })?.response?.data?.error;
      const msg = errorData?.message || "Failed to record results";
      const details = errorData?.details?.map((d) => `${d.field}: ${d.message}`).join("; ") || "";
      toast({ title: msg, description: details || undefined, variant: "destructive" });
    },
  });

  function initResults(insp: Inspection) {
    if (insp.results && insp.results.length > 0 && results.length === 0) {
      setResults(insp.results.map((r) => ({
        checklistItemId: r.checklist_item_id || null,
        itemDescription: r.item_description,
        isPass: r.is_pass,
        actualValue: r.actual_value || "",
        actualNumeric: r.actual_numeric?.toString() || "",
        notes: r.notes || "",
        isCritical: false,
      })));
    }
  }

  function handleRecord() {
    if (!inspection) return;
    const payload: RecordResultsPayload = {
      results: results.map((r) => ({
        checklistItemId: r.checklistItemId,
        itemDescription: r.itemDescription,
        actualValue: r.actualValue || null,
        actualNumeric: r.actualNumeric ? Number(r.actualNumeric) : null,
        isPass: r.isPass,
        notes: r.notes || null,
      })),
      status: finalStatus,
      resultSummary: finalSummary,
      notes: notes || null,
    };
    recordMutation.mutate(payload);
  }

  if (isLoading) return <LoadingSpinner />;
  if (isError || !inspection) return <p className="text-destructive">Failed to load inspection</p>;

  initResults(inspection);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.QUALITY_INSPECTIONS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{inspection.inspection_number}</h2>
            <p className="text-muted-foreground text-sm">Created {new Date(inspection.created_at).toLocaleDateString()}</p>
          </div>
          <Badge variant={getInspectionStatusColor(inspection.status)} className="ml-2">
            {getInspectionStatusLabel(inspection.status)}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {inspection.status === "pending" && (
            <Button variant="default" size="sm" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
              <Play className="mr-2 h-4 w-4" /> {startMutation.isPending ? "Starting..." : "Start Inspection"}
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Checklist Items &amp; Results</CardTitle>
            </CardHeader>
            <CardContent>
              {checklistItems.length > 0 ? (
                <div className="space-y-3">
                  {checklistItems.map((item) => {
                    const resIdx = results.findIndex((r) => r.checklistItemId === item.id);
                    const res = resIdx >= 0 ? results[resIdx] : null;
                    return (
                      <div key={item.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">{item.description}</p>
                            <p className="text-xs text-muted-foreground">
                              Expected: {item.expected_value || "—"}
                              {item.min_value != null && ` | Range: ${item.min_value}–${item.max_value ?? "∞"}${item.unit ? ` ${item.unit}` : ""}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {item.is_critical && <Badge variant="destructive" className="text-[10px]">Critical</Badge>}
                          </div>
                        </div>
                        {item.inspection_method && (
                          <p className="text-xs text-muted-foreground mb-2">Method: {item.inspection_method}</p>
                        )}
                        {isEditable ? (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Value</Label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Text value"
                                value={res?.actualValue || ""}
                                onChange={(e) => {
                                  const newResults = [...results];
                                  if (resIdx >= 0) newResults[resIdx] = { ...newResults[resIdx], actualValue: e.target.value };
                                  else newResults.push({ checklistItemId: item.id, itemDescription: item.description, isPass: true, actualValue: e.target.value, actualNumeric: "", notes: "", isCritical: item.is_critical });
                                  setResults(newResults);
                                }}
                              />
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Numeric</Label>
                              <Input
                                className="h-8 text-xs"
                                type="number" step="any"
                                placeholder="Numeric"
                                value={res?.actualNumeric || ""}
                                onChange={(e) => {
                                  const newResults = [...results];
                                  if (resIdx >= 0) newResults[resIdx] = { ...newResults[resIdx], actualNumeric: e.target.value };
                                  else newResults.push({ checklistItemId: item.id, itemDescription: item.description, isPass: true, actualValue: "", actualNumeric: e.target.value, notes: "", isCritical: item.is_critical });
                                  setResults(newResults);
                                }}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-5">
                              <input
                                type="checkbox"
                                id={`pass-${item.id}`}
                                checked={res?.isPass ?? true}
                                onChange={(e) => {
                                  const newResults = [...results];
                                  const existing = newResults[resIdx];
                                  if (existing) newResults[resIdx] = { ...existing, isPass: e.target.checked };
                                  else newResults.push({ checklistItemId: item.id, itemDescription: item.description, isPass: e.target.checked, actualValue: "", actualNumeric: "", notes: "", isCritical: item.is_critical });
                                  setResults(newResults);
                                }}
                                className="h-4 w-4"
                              />
                              <Label htmlFor={`pass-${item.id}`} className="text-xs">Pass</Label>
                            </div>
                            <div>
                              <Label className="text-[10px] text-muted-foreground">Notes</Label>
                              <Input
                                className="h-8 text-xs"
                                placeholder="Notes"
                                value={res?.notes || ""}
                                onChange={(e) => {
                                  const newResults = [...results];
                                  if (resIdx >= 0) newResults[resIdx] = { ...newResults[resIdx], notes: e.target.value };
                                  else newResults.push({ checklistItemId: item.id, itemDescription: item.description, isPass: true, actualValue: "", actualNumeric: "", notes: e.target.value, isCritical: item.is_critical });
                                  setResults(newResults);
                                }}
                              />
                            </div>
                          </div>
                        ) : res ? (
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div>
                              <span className="text-[10px] text-muted-foreground">Actual: </span>
                              <span className="text-xs">{res.actualValue || res.actualNumeric || "—"}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-muted-foreground">Result: </span>
                              <Badge variant={res.isPass ? "success" : "destructive"} className="text-[10px]">
                                {res.isPass ? "Pass" : "Fail"}
                              </Badge>
                            </div>
                            {res.notes && (
                              <div className="col-span-3">
                                <span className="text-[10px] text-muted-foreground">Notes: </span>
                                <span className="text-xs">{res.notes}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-1">No result recorded</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No checklist assigned to this inspection</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source</span>
                <span>{getReferenceLabel(inspection.reference_type)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source ID</span>
                <span className="font-mono text-xs">{inspection.reference_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Checklist</span>
                <span>{inspection.checklist?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inspected By</span>
                <span>{inspection.inspected_by || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : "—"}</span>
              </div>
              {inspection.result_summary && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summary</span>
                  <Badge variant={inspection.result_summary === "pass" ? "success" : inspection.result_summary === "fail" ? "destructive" : "warning"}>
                    {inspection.result_summary.replace("_", " ")}
                  </Badge>
                </div>
              )}
              {inspection.notes && (
                <div>
                  <span className="text-muted-foreground">Notes: </span>
                  <span>{inspection.notes}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {isEditable && checklistItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Record Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Status</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={finalStatus}
                    onChange={(e) => setFinalStatus(e.target.value)}
                  >
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Result Summary</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={finalSummary}
                    onChange={(e) => setFinalSummary(e.target.value)}
                  >
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="conditional_pass">Conditional Pass</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <textarea
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <Button
                  className="w-full" size="sm"
                  disabled={recordMutation.isPending}
                  onClick={handleRecord}
                >
                  {recordMutation.isPending ? "Saving..." : "Save Results"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Inspection"
        description={`Are you sure you want to delete ${inspection.inspection_number}?`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
