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
import { createPurchaseOrder, type CreatePurchaseOrderItemPayload } from "@/modules/procurement/purchase-order.api";
import { listVendors } from "@/modules/vendor/vendor.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, Plus, Trash2, Truck } from "lucide-react";

interface LineItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [vendorId, setVendorId] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const { data: vendorsData } = useQuery({
    queryKey: [...CACHE_KEYS.VENDORS, { limit: 100 }],
    queryFn: () => listVendors({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100, search: productSearch || undefined }],
    queryFn: () => listProducts({ limit: 100, search: productSearch || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        vendorId,
        expectedDate: expectedDate || null,
        notes: notes || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          taxPercent: i.taxPercent,
        })),
      };
      return createPurchaseOrder(payload);
    },
    onSuccess: (po) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDERS });
      toast({ title: "Purchase order created", variant: "success" });
      router.push(ROUTES.PROCUREMENT_DETAIL(po.id));
    },
    onError: () => toast({ title: "Failed to create purchase order", variant: "destructive" }),
  });

  const addItem = (productId: string, name: string, sku: string, price: number) => {
    setItems((prev) => [
      ...prev,
      { productId, productName: name, productSku: sku, quantity: 1, unitPrice: price, discountPercent: 0, taxPercent: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: typeof value === "string" ? parseFloat(value) || 0 : value } : item))
    );
  };

  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const discountTotal = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice) * (i.discountPercent / 100), 0);
  const taxableAmount = subtotal - discountTotal;
  const taxTotal = items.reduce((sum, i) => {
    const lineSubtotal = i.quantity * i.unitPrice;
    const lineDiscount = lineSubtotal * (i.discountPercent / 100);
    return sum + (lineSubtotal - lineDiscount) * (i.taxPercent / 100);
  }, 0);
  const grandTotal = taxableAmount + taxTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.PROCUREMENT)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Purchase Order</h2>
          <p className="text-muted-foreground text-sm">Create a purchase order for a vendor</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Vendor</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
              >
                <option value="">Select a vendor...</option>
                {vendorsData?.data.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.code})</option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium">Order Items</CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="max-w-[200px] h-8 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-1 mb-3">
                {productsData?.data.filter((p) => p.is_active).slice(0, 10).map((p) => (
                  <Button
                    key={p.id}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => addItem(p.id, p.name, p.sku, p.unit_price)}
                  >
                    {p.sku}
                  </Button>
                ))}
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  Click a product above to add it to the order
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-end gap-2 rounded-lg border p-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">{item.productSku}</p>
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">Qty</Label>
                        <Input type="number" min={0.0001} step={1} value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                          className="h-8 text-sm" />
                      </div>
                      <div className="w-20">
                        <Label className="text-xs">Price</Label>
                        <Input type="number" min={0} step={0.01} value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          className="h-8 text-sm" />
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">Disc %</Label>
                        <Input type="number" min={0} max={100} step={1} value={item.discountPercent}
                          onChange={(e) => updateItem(idx, "discountPercent", e.target.value)}
                          className="h-8 text-sm" />
                      </div>
                      <div className="w-16">
                        <Label className="text-xs">Tax %</Label>
                        <Input type="number" min={0} max={100} step={1} value={item.taxPercent}
                          onChange={(e) => updateItem(idx, "taxPercent", e.target.value)}
                          className="h-8 text-sm" />
                      </div>
                      <div className="text-sm font-medium w-24 text-right">
                        ${(item.quantity * item.unitPrice).toFixed(2)}
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="expectedDate">Expected Delivery Date</Label>
                <Input id="expectedDate" type="date" value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)} className="max-w-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="PO notes..."
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
              <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-${discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${taxTotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-base">
                <span>Total</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full"
            size="lg"
            disabled={!vendorId || items.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating..." : "Create Purchase Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
