"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { createShipment, listCarriers, type CreateShipmentPayload } from "@/modules/shipping/shipping.api";
import { listOrders } from "@/modules/order/order.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, Plus, Trash2, Truck } from "lucide-react";

interface LineItem {
  productId: string;
  quantity: number;
  unitWeight?: number | null;
}

export default function NewShipmentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    salesOrderId: "",
    carrierId: "",
    carrierTrackingNumber: "",
    originAddress: "",
    destinationAddress: "",
    estimatedDeliveryDate: "",
    totalWeight: "",
    weightUnit: "kg",
    totalValue: "",
    shippingCost: "",
    currency: "USD",
    notes: "",
  });
  const [items, setItems] = useState<LineItem[]>([]);

  const { data: carriersData } = useQuery({
    queryKey: [...CACHE_KEYS.SHIPPING_CARRIERS, { limit: 100 }],
    queryFn: () => listCarriers({ limit: 100 }),
  });

  const { data: ordersData } = useQuery({
    queryKey: [...CACHE_KEYS.ORDERS, { limit: 100 }],
    queryFn: () => listOrders({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100 }],
    queryFn: () => listProducts({ limit: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload: CreateShipmentPayload = {
        salesOrderId: form.salesOrderId || null,
        carrierId: form.carrierId || null,
        carrierTrackingNumber: form.carrierTrackingNumber || null,
        originAddress: form.originAddress || null,
        destinationAddress: form.destinationAddress || null,
        estimatedDeliveryDate: form.estimatedDeliveryDate || null,
        totalWeight: form.totalWeight ? Number(form.totalWeight) : null,
        weightUnit: form.weightUnit,
        totalValue: form.totalValue ? Number(form.totalValue) : null,
        shippingCost: form.shippingCost ? Number(form.shippingCost) : null,
        currency: form.currency,
        notes: form.notes || null,
        items: items.length > 0 ? items : undefined,
      };
      return createShipment(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_SHIPMENTS });
      toast({ title: "Shipment created", variant: "success" });
      router.push(ROUTES.SHIPPING_SHIPMENT_DETAIL(data.id));
    },
    onError: () => toast({ title: "Failed to create shipment", variant: "destructive" }),
  });

  const addItem = () => setItems([...items, { productId: "", quantity: 1 }]);
  const updateItem = (i: number, field: keyof LineItem, value: any) => {
    const copy = [...items];
    (copy[i] as any)[field] = value;
    setItems(copy);
  };
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.SHIPPING_SHIPMENTS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Shipment</h2>
          <p className="text-muted-foreground text-sm">Create an outgoing shipment</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Sales Order</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.salesOrderId} onChange={(e) => setForm({ ...form, salesOrderId: e.target.value })}>
                <option value="">No order (standalone)</option>
                {ordersData?.data?.map((o) => (
                  <option key={o.id} value={o.id}>{o.order_number}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Carrier</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.carrierId} onChange={(e) => setForm({ ...form, carrierId: e.target.value })}>
                <option value="">Select carrier</option>
                {carriersData?.data?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Carrier Tracking #</Label>
              <Input value={form.carrierTrackingNumber} onChange={(e) => setForm({ ...form, carrierTrackingNumber: e.target.value })} placeholder="Tracking number" />
            </div>
            <div className="space-y-1">
              <Label>Estimated Delivery Date</Label>
              <Input type="date" value={form.estimatedDeliveryDate} onChange={(e) => setForm({ ...form, estimatedDeliveryDate: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Addresses</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Origin Address</Label>
              <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.originAddress} onChange={(e) => setForm({ ...form, originAddress: e.target.value })} placeholder="Warehouse address" />
            </div>
            <div className="space-y-1">
              <Label>Destination Address</Label>
              <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.destinationAddress} onChange={(e) => setForm({ ...form, destinationAddress: e.target.value })} placeholder="Customer address" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Items</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}><Plus className="mr-1 h-3 w-3" /> Add Item</Button>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items added</p>
          ) : (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                      value={item.productId} onChange={(e) => updateItem(i, "productId", e.target.value)}>
                      <option value="">Select product</option>
                      {productsData?.data?.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" className="h-8 text-xs" min={0.0001} step={1}
                      value={item.quantity} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label className="text-xs">Unit Wt (kg)</Label>
                    <Input type="number" className="h-8 text-xs" min={0} step={0.1}
                      value={item.unitWeight ?? ""} onChange={(e) => updateItem(i, "unitWeight", e.target.value ? Number(e.target.value) : null)} />
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeItem(i)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Financials</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Total Weight</Label>
              <Input type="number" min={0} step={0.1} value={form.totalWeight}
                onChange={(e) => setForm({ ...form, totalWeight: e.target.value })} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Weight Unit</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.weightUnit} onChange={(e) => setForm({ ...form, weightUnit: e.target.value })}>
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Currency</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label>Total Value</Label>
              <Input type="number" min={0} step={0.01} value={form.totalValue}
                onChange={(e) => setForm({ ...form, totalValue: e.target.value })} placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <Label>Shipping Cost</Label>
              <Input type="number" min={0} step={0.01} value={form.shippingCost}
                onChange={(e) => setForm({ ...form, shippingCost: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <Label>Notes</Label>
            <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          <Truck className="mr-2 h-4 w-4" />{createMutation.isPending ? "Creating..." : "Create Shipment"}
        </Button>
      </div>
    </div>
  );
}
