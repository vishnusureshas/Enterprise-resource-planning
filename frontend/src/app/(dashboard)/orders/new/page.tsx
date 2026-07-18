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
import { createOrder, type CreateOrderItemPayload } from "@/modules/order/order.api";
import { listCustomers } from "@/modules/customer/customer.api";
import { listProducts } from "@/modules/inventory/inventory.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, Plus, Trash2, ShoppingCart } from "lucide-react";

interface LineItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([]);
  const [productSearch, setProductSearch] = useState("");

  const { data: customersData } = useQuery({
    queryKey: [...CACHE_KEYS.CUSTOMERS, { limit: 100 }],
    queryFn: () => listCustomers({ limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: [...CACHE_KEYS.INVENTORY_ITEMS, { limit: 100, search: productSearch || undefined }],
    queryFn: () => listProducts({ limit: 100, search: productSearch || undefined }),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        customerId,
        notes: notes || null,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          discountPercent: i.discountPercent,
          taxPercent: i.taxPercent,
        })),
      };
      return createOrder(payload);
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDERS });
      toast({ title: "Order created", variant: "success" });
      router.push(ROUTES.ORDER_DETAIL(order.id));
    },
    onError: () => toast({ title: "Failed to create order", variant: "destructive" }),
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
        <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.ORDERS)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Sales Order</h2>
          <p className="text-muted-foreground text-sm">Create a new customer order</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — customer + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select a customer...</option>
                {customersData?.data.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Line Items */}
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
              {/* Product quick-add */}
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

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Order notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column — totals + submit */}
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
            disabled={!customerId || items.length === 0 || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
