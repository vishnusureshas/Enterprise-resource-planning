"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import {
  getWorkOrder, updateWorkOrderStatus, startProduction, completeProduction,
  recordConsumption, recordOutput, getWoStatusLabel, getWoStatusColor,
  getPriorityLabel, getPriorityColor,
  type WorkOrder, type WorkOrderConsumption, type WorkOrderOutput,
} from "@/modules/manufacturing/manufacturing.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import {
  ArrowLeft, ClipboardList, Play, CheckCircle2, XCircle,
  Package, ArrowDownToLine, ArrowUpFromLine, Plus,
} from "lucide-react";

const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ["planned", "cancelled"],
  planned: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const PRODUCIBLE_STATUSES = ["draft", "planned"];

const ALLOW_CONSUME = ["in_progress"];
const ALLOW_OUTPUT = ["in_progress"];

export default function WorkOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;

  const [showConsume, setShowConsume] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [consumeProductId, setConsumeProductId] = useState("");
  const [consumeQty, setConsumeQty] = useState("1");
  const [outputProductId, setOutputProductId] = useState("");
  const [outputQty, setOutputQty] = useState("1");
  const [outputBatch, setOutputBatch] = useState("");
  const [outputDefective, setOutputDefective] = useState(false);
  const [outputNotes, setOutputNotes] = useState("");

  const { data: wo, isLoading } = useQuery({
    queryKey: CACHE_KEYS.WORK_ORDER(id),
    queryFn: () => getWorkOrder(id),
  });

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100 }],
    queryFn: () => listProducts({ limit: 100 }),
    enabled: showConsume || showOutput,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WORK_ORDER(id) });
    queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WORK_ORDERS });
  };

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateWorkOrderStatus(id, status),
    onSuccess: () => { invalidate(); toast({ title: "Status updated", variant: "success" }); },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const startMutation = useMutation({
    mutationFn: () => startProduction(id),
    onSuccess: () => { invalidate(); toast({ title: "Production started", variant: "success" }); },
    onError: () => toast({ title: "Failed to start production", variant: "destructive" }),
  });

  const completeMutation = useMutation({
    mutationFn: () => completeProduction(id),
    onSuccess: () => { invalidate(); toast({ title: "Production completed", variant: "success" }); },
    onError: () => toast({ title: "Failed to complete production", variant: "destructive" }),
  });

  const consumeMutation = useMutation({
    mutationFn: () => {
      if (!consumeProductId) throw new Error("Product required");
      return recordConsumption(id, {
        productId: consumeProductId,
        quantityActual: parseFloat(consumeQty),
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Consumption recorded", variant: "success" });
      setShowConsume(false);
      setConsumeProductId("");
      setConsumeQty("1");
    },
    onError: () => toast({ title: "Failed to record consumption", variant: "destructive" }),
  });

  const outputMutation = useMutation({
    mutationFn: () => {
      if (!outputProductId) throw new Error("Product required");
      return recordOutput(id, {
        productId: outputProductId,
        quantity: parseFloat(outputQty),
        batchNumber: outputBatch || null,
        isDefective: outputDefective,
        notes: outputNotes || null,
      });
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Output recorded", variant: "success" });
      setShowOutput(false);
      setOutputProductId("");
      setOutputQty("1");
      setOutputBatch("");
      setOutputDefective(false);
      setOutputNotes("");
    },
    onError: () => toast({ title: "Failed to record output", variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!wo) return <div className="text-muted-foreground py-8 text-center">Work order not found</div>;

  const transitions = STATUS_TRANSITIONS[wo.status] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDERS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{wo.work_order_number}</h2>
          <p className="text-muted-foreground text-sm">{wo.product.name} ({wo.product.sku})</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant={getWoStatusColor(wo.status)} className="text-sm px-3 py-1">
            {getWoStatusLabel(wo.status)}
          </Badge>
          <Badge variant={getPriorityColor(wo.priority)}>
            {getPriorityLabel(wo.priority)}
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {PRODUCIBLE_STATUSES.includes(wo.status) && (
          <Button size="sm" onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
            <Play className="mr-1 h-4 w-4" /> Start Production
          </Button>
        )}
        {wo.status === "in_progress" && (
          <Button size="sm" onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending}>
            <CheckCircle2 className="mr-1 h-4 w-4" /> Complete Production
          </Button>
        )}
        {ALLOW_CONSUME.includes(wo.status) && (
          <Button size="sm" variant="outline" onClick={() => setShowConsume(!showConsume)}>
            <ArrowDownToLine className="mr-1 h-4 w-4" /> Record Consumption
          </Button>
        )}
        {ALLOW_OUTPUT.includes(wo.status) && (
          <Button size="sm" variant="outline" onClick={() => setShowOutput(!showOutput)}>
            <ArrowUpFromLine className="mr-1 h-4 w-4" /> Record Output
          </Button>
        )}
        {transitions.filter((t) => !["in_progress", "completed"].includes(t)).map((status) => (
          <Button
            key={status}
            size="sm"
            variant={status === "cancelled" ? "destructive" : "outline"}
            onClick={() => statusMutation.mutate(status)}
            disabled={statusMutation.isPending}
          >
            {status === "cancelled" ? <XCircle className="mr-1 h-4 w-4" /> : null}
            {status === "planned" ? "Plan" : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {/* Quick Consume Form */}
      {showConsume && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Record Material Consumption</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Material *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={consumeProductId} onChange={(e) => setConsumeProductId(e.target.value)}
              >
                <option value="">Select material...</option>
                {productsData?.data.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" min={0.0001} step="any" value={consumeQty}
                onChange={(e) => setConsumeQty(e.target.value)} className="max-w-xs" />
            </div>
            <Button size="sm" onClick={() => consumeMutation.mutate()} disabled={!consumeProductId || consumeMutation.isPending}>
              Record Consumption
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Output Form */}
      {showOutput && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Record Production Output</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label>Product *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={outputProductId} onChange={(e) => setOutputProductId(e.target.value)}
              >
                <option value="">Select product...</option>
                {productsData?.data.filter((p) => p.is_active).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min={0.0001} step="any" value={outputQty}
                  onChange={(e) => setOutputQty(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Batch Number</Label>
                <Input value={outputBatch} onChange={(e) => setOutputBatch(e.target.value)} placeholder="BATCH-001" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isDefective" checked={outputDefective}
                onChange={(e) => setOutputDefective(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300" />
              <Label htmlFor="isDefective" className="text-sm">Defective / Scrap</Label>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <textarea
                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={outputNotes} onChange={(e) => setOutputNotes(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={() => outputMutation.mutate()} disabled={!outputProductId || outputMutation.isPending}>
              Record Output
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Info Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span>{wo.product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">SKU</span>
              <span>{wo.product.sku}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span>{wo.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produced</span>
              <span>{wo.quantity_produced}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Scrapped</span>
              <span>{wo.quantity_scrapped}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Work Center</span>
              <span>{wo.work_center?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">BOM</span>
              <span>{wo.bom?.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <Badge variant={getPriorityColor(wo.priority)} className="text-xs">
                {getPriorityLabel(wo.priority)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span>{wo.start_date ? new Date(wo.start_date).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Due Date</span>
              <span>{wo.due_date ? new Date(wo.due_date).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span>{wo.completed_date ? new Date(wo.completed_date).toLocaleDateString() : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{new Date(wo.created_at).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations */}
      {wo.operations && wo.operations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operations ({wo.operations.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wo.operations.map((op) => (
                <div key={op.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">#{op.sequence}</span>
                    <div>
                      <p className="text-sm font-medium">{op.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {op.work_center?.name || "No work center"} {op.planned_duration_minutes ? `· ${op.planned_duration_minutes}min` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge variant={op.status === "completed" ? "success" : "secondary"}>
                    {op.status || "pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operations placeholder */}
      {(!wo.operations || wo.operations.length === 0) && wo.status !== "draft" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground py-4 text-center">No operations defined</p>
          </CardContent>
        </Card>
      )}

      {/* Consumptions */}
      {wo.consumptions && wo.consumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Material Consumptions ({wo.consumptions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wo.consumptions.map((c: WorkOrderConsumption) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{c.product.name}</p>
                    <p className="text-xs text-muted-foreground">{c.product.sku}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{c.quantity_actual} used</p>
                    {c.quantity_planned && <p className="text-xs text-muted-foreground">Planned: {c.quantity_planned}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outputs */}
      {wo.outputs && wo.outputs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Production Outputs ({wo.outputs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {wo.outputs.map((o: WorkOrderOutput) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{o.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.product.sku}
                      {o.batch_number ? ` · Batch: ${o.batch_number}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-right text-sm">
                    <span className="font-medium">{o.quantity} units</span>
                    {o.is_defective && <Badge variant="destructive" className="text-xs">Defective</Badge>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {wo.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{wo.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
