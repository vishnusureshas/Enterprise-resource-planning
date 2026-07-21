"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { createWorkOrder } from "@/modules/manufacturing/manufacturing.api";
import { listBoms, listWorkCenters } from "@/modules/manufacturing/manufacturing.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, ClipboardList } from "lucide-react";

export default function NewWorkOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState("");
  const [bomId, setBomId] = useState("");
  const [workCenterId, setWorkCenterId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [priority, setPriority] = useState("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100 }],
    queryFn: () => listProducts({ limit: 100 }),
  });

  const { data: bomsData } = useQuery({
    queryKey: [...CACHE_KEYS.BOMS, { limit: 100 }],
    queryFn: () => listBoms({ limit: 100 }),
  });

  const { data: centersData } = useQuery({
    queryKey: [...CACHE_KEYS.WORK_CENTERS, { limit: 100 }],
    queryFn: () => listWorkCenters({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createWorkOrder({
        productId,
        bomId: bomId || null,
        workCenterId: workCenterId || null,
        quantity: parseFloat(quantity),
        priority,
        startDate: startDate || null,
        dueDate: dueDate || null,
        notes: notes || null,
      }),
    onSuccess: (wo) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WORK_ORDERS });
      toast({ title: "Work order created", variant: "success" });
      router.push(ROUTES.MANUFACTURING_WORK_ORDER_DETAIL(wo.id));
    },
    onError: () => toast({ title: "Failed to create work order", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.MANUFACTURING_WORK_ORDERS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Work Order</h2>
          <p className="text-muted-foreground text-sm">Create a production work order</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Production Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <select
                  id="productId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                >
                  <option value="">Select product...</option>
                  {productsData?.data.filter((p) => p.is_active).map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input id="quantity" type="number" min={0.0001} step={1} value={quantity}
                    onChange={(e) => setQuantity(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select id="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={priority} onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bomId">Bill of Materials</Label>
                  <select id="bomId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={bomId} onChange={(e) => setBomId(e.target.value)}
                  >
                    <option value="">No BOM</option>
                    {bomsData?.data.filter((b) => b.is_active).map((b) => (
                      <option key={b.id} value={b.id}>{b.name} (v{b.version})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="workCenterId">Work Center</Label>
                  <select id="workCenterId"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={workCenterId} onChange={(e) => setWorkCenterId(e.target.value)}
                  >
                    <option value="">No work center</option>
                    {centersData?.data.filter((wc) => wc.is_active).map((wc) => (
                      <option key={wc.id} value={wc.id}>{wc.name} ({wc.code})</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Schedule & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input id="startDate" type="date" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" type="date" value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Work order notes..." value={notes}
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
                <span className="text-muted-foreground">Product</span>
                <span>{productsData?.data.find((p) => p.id === productId)?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span>{quantity || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Priority</span>
                <span className="capitalize">{priority}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">BOM</span>
                <span>{bomsData?.data.find((b) => b.id === bomId)?.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Work Center</span>
                <span>{centersData?.data.find((wc) => wc.id === workCenterId)?.name || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full" size="lg"
            disabled={!productId || !quantity || parseFloat(quantity) <= 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating..." : "Create Work Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
