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
import { toast } from "@/components/ui/use-toast";
import {
  getOrder, updateOrderStatus, cancelOrder, recordPayment,
  getOrderStatusLabel, getOrderStatusColor,
  type SalesOrder, type OrderStatus, type SalesOrderPayment,
} from "@/modules/order/order.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import {
  ArrowLeft, ShoppingCart, DollarSign, Clock, Truck,
} from "lucide-react";

const STATUS_TRANSITIONS: Record<string, OrderStatus[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentRef, setPaymentRef] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: CACHE_KEYS.ORDER(id),
    queryFn: () => getOrder(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDER(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDERS });
      toast({ title: "Order status updated", variant: "success" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDER(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDERS });
      toast({ title: "Order cancelled", variant: "success" });
    },
    onError: () => toast({ title: "Failed to cancel order", variant: "destructive" }),
  });

  const paymentMutation = useMutation({
    mutationFn: () => recordPayment(id, {
      amount: parseFloat(paymentAmount),
      paymentMethod: paymentMethod || null,
      referenceNumber: paymentRef || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ORDER(id) });
      toast({ title: "Payment recorded", variant: "success" });
      setShowPayment(false);
      setPaymentAmount("");
      setPaymentMethod("");
      setPaymentRef("");
    },
    onError: () => toast({ title: "Failed to record payment", variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <p className="text-muted-foreground">Order not found</p>;

  const nextStatuses = STATUS_TRANSITIONS[order.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.ORDERS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{order.order_number}</h2>
            <p className="text-muted-foreground text-sm">
              {order.customer?.name} · {new Date(order.order_date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getOrderStatusColor(order.status)} className="text-sm">
            {getOrderStatusLabel(order.status)}
          </Badge>
        </div>
      </div>

      {/* Status Actions */}
      {nextStatuses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {nextStatuses.map((status) => (
            <Button
              key={status}
              variant={status === "cancelled" ? "destructive" : "default"}
              size="sm"
              onClick={() => status === "cancelled" ? cancelMutation.mutate() : statusMutation.mutate(status)}
            >
              {status === "confirmed" ? "Confirm Order" :
               status === "processing" ? "Start Processing" :
               status === "shipped" ? "Mark Shipped" :
               status === "delivered" ? "Mark Delivered" :
               status === "returned" ? "Mark Returned" :
               status === "cancelled" ? "Cancel Order" : status}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-1 text-right">Disc</div>
                    <div className="col-span-1 text-right">Tax</div>
                    <div className="col-span-3 text-right">Total</div>
                  </div>
                  {order.items.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0">
                      <div className="col-span-4">
                        <p className="font-medium truncate">{item.product_name || item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">{item.product_code || item.product?.sku}</p>
                      </div>
                      <div className="col-span-1 text-right">{item.quantity}</div>
                      <div className="col-span-2 text-right">${Number(item.unit_price).toFixed(2)}</div>
                      <div className="col-span-1 text-right text-destructive">{item.discount_percent}%</div>
                      <div className="col-span-1 text-right">{item.tax_percent}%</div>
                      <div className="col-span-3 text-right font-medium">${Number(item.line_total).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items</p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" /> Payments
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowPayment(!showPayment)}>
                Record Payment
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {showPayment && (
                <div className="flex items-end gap-2 p-3 rounded-lg border bg-muted/50">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Amount</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)} className="h-8" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Method</Label>
                    <Input placeholder="Cash, Card, etc." value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)} className="h-8" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs">Ref #</Label>
                    <Input placeholder="REF-001" value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)} className="h-8" />
                  </div>
                  <Button size="sm" disabled={!paymentAmount || paymentMutation.isPending}
                    onClick={() => paymentMutation.mutate()}>
                    Save
                  </Button>
                </div>
              )}

              {order.payments && order.payments.length > 0 ? (
                <div className="space-y-2">
                  {order.payments.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-sm rounded-lg border p-3">
                      <div>
                        <span className="font-medium">${Number(p.amount).toFixed(2)}</span>
                        {p.payment_method && <span className="text-muted-foreground ml-2">({p.payment_method})</span>}
                        {p.reference_number && <span className="text-muted-foreground ml-2">#{p.reference_number}</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payments recorded</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-${Number(order.discount_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(order.tax_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>${Number(order.shipping_total).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-base">
                <span>Total</span>
                <span>${Number(order.grand_total).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-green-600">${Number(order.paid_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance Due</span>
                <span className="text-destructive">${Number(order.balance_due || order.grand_total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Truck className="h-4 w-4" /> Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span>{order.currency_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              {order.customer && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <button
                    className="text-primary hover:underline text-right"
                    onClick={() => router.push(ROUTES.CUSTOMER_DETAIL(order.customer!.id))}
                  >
                    {order.customer.name}
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
