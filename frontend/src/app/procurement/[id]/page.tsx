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
  getPurchaseOrder, updatePurchaseOrderStatus, receiveGoods, returnPurchaseOrder,
  getPoStatusLabel, getPoStatusColor,
  type PurchaseOrder, type PoStatus, type PurchaseOrderItem,
} from "@/modules/procurement/purchase-order.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import {
  ArrowLeft, Truck, DollarSign, Package, Clock, Undo2,
} from "lucide-react";

const STATUS_TRANSITIONS: Record<string, PoStatus[]> = {
  draft: ["pending", "cancelled"],
  pending: ["approved", "cancelled"],
  approved: ["ordered", "cancelled"],
  ordered: ["partial", "received", "cancelled"],
  partial: ["received", "cancelled"],
  received: [],
  cancelled: [],
};

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [showReceive, setShowReceive] = useState(false);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiveQtys, setReceiveQtys] = useState<Record<string, string>>({});
  const [showReturn, setShowReturn] = useState(false);
  const [returnNotes, setReturnNotes] = useState("");
  const [returnQtys, setReturnQtys] = useState<Record<string, string>>({});

  const { data: po, isLoading } = useQuery({
    queryKey: CACHE_KEYS.PURCHASE_ORDER(id),
    queryFn: () => getPurchaseOrder(id),
  });

  const statusMutation = useMutation({
    mutationFn: (status: PoStatus) => updatePurchaseOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDER(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDERS });
      toast({ title: "Purchase order status updated", variant: "success" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const items = (po?.items || [])
        .filter((item) => {
          const qty = parseFloat(receiveQtys[item.id] || "0");
          return qty > 0;
        })
        .map((item) => ({
          purchaseOrderItemId: item.id,
          productId: item.product_id,
          quantity: parseFloat(receiveQtys[item.id] || "0"),
        }));
      return receiveGoods(id, { notes: receiptNotes || null, items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDER(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDERS });
      toast({ title: "Goods received", variant: "success" });
      setShowReceive(false);
      setReceiptNotes("");
      setReceiveQtys({});
    },
    onError: () => toast({ title: "Failed to receive goods", variant: "destructive" }),
  });

  const returnMutation = useMutation({
    mutationFn: () => {
      const items = (po?.items || [])
        .filter((item) => {
          const qty = parseFloat(returnQtys[item.id] || "0");
          return qty > 0;
        })
        .map((item) => ({
          purchaseOrderItemId: item.id,
          productId: item.product_id,
          quantity: parseFloat(returnQtys[item.id] || "0"),
          reason: "Defective",
        }));
      if (items.length === 0) throw new Error("No items selected for return");
      return returnPurchaseOrder(id, { notes: returnNotes || null, items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDER(id) });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.PURCHASE_ORDERS });
      toast({ title: "Return processed", variant: "success" });
      setShowReturn(false);
      setReturnNotes("");
      setReturnQtys({});
    },
    onError: (err: Error) => toast({ title: "Failed to process return", description: err.message, variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!po) return <p className="text-muted-foreground">Purchase order not found</p>;

  const nextStatuses = STATUS_TRANSITIONS[po.status] || [];
  const canReceive = po.status === "ordered" || po.status === "partial";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.PROCUREMENT)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{po.po_number}</h2>
            <p className="text-muted-foreground text-sm">
              {po.vendor?.name} · {new Date(po.order_date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={getPoStatusColor(po.status)} className="text-sm">
            {getPoStatusLabel(po.status)}
          </Badge>
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {nextStatuses.map((status) => (
            <Button
              key={status}
              variant={status === "cancelled" ? "destructive" : "default"}
              size="sm"
              onClick={() => statusMutation.mutate(status)}
            >
              {status === "pending" ? "Submit for Approval" :
               status === "approved" ? "Approve" :
               status === "ordered" ? "Place Order" :
               status === "partial" ? "Mark Partial" :
               status === "received" ? "Mark Received" :
               status === "cancelled" ? "Cancel PO" : status}
            </Button>
          ))}
        </div>
      )}

      {canReceive && (
        <Button variant="outline" size="sm" onClick={() => setShowReceive(!showReceive)}>
          <Package className="mr-1 h-4 w-4" /> Receive Goods
        </Button>
      )}

      {(po.status === "partial" || po.status === "received") && (
        <Button variant="outline" size="sm" onClick={() => setShowReturn(!showReturn)}>
          <Undo2 className="mr-1 h-4 w-4" /> Return to Vendor
        </Button>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showReceive && po.items && po.items.length > 0 && (
                <div className="mb-4 rounded-lg border p-3 bg-muted/30 space-y-3">
                  <p className="text-sm font-medium">Enter quantities to receive</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input className="h-8 text-xs" placeholder="Receipt notes..." value={receiptNotes}
                      onChange={(e) => setReceiptNotes(e.target.value)} />
                  </div>
                  <Button size="sm" disabled={receiveMutation.isPending}
                    onClick={() => receiveMutation.mutate()}>
                    {receiveMutation.isPending ? "Receiving..." : "Confirm Receipt"}
                  </Button>
                </div>
              )}

              {showReturn && po.items && po.items.length > 0 && (
                <div className="mb-4 rounded-lg border p-3 bg-destructive/10 space-y-3">
                  <p className="text-sm font-medium text-destructive">Enter quantities to return</p>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Input className="h-8 text-xs" placeholder="Return reason..." value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)} />
                  </div>
                  <Button size="sm" variant="destructive" disabled={returnMutation.isPending}
                    onClick={() => returnMutation.mutate()}>
                    {returnMutation.isPending ? "Processing..." : "Confirm Return"}
                  </Button>
                </div>
              )}

              {po.items && po.items.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
                    <div className="col-span-4">Item</div>
                    <div className="col-span-1 text-right">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-1 text-right">Disc</div>
                    <div className="col-span-1 text-right">Tax</div>
                    <div className="col-span-2 text-right">Received</div>
                    <div className="col-span-1 text-right">Total</div>
                  </div>
                  {po.items.map((item) => {
                    const remaining = item.quantity - item.received_quantity;
                    return (
                      <div key={item.id} className="grid grid-cols-12 gap-2 text-sm py-2 border-b last:border-0 items-center">
                        <div className="col-span-4">
                          <p className="font-medium truncate">{item.product_name || item.product?.name}</p>
                          <p className="text-xs text-muted-foreground">{item.product_code || item.product?.sku}</p>
                        </div>
                        <div className="col-span-1 text-right">{item.quantity}</div>
                        <div className="col-span-2 text-right">${Number(item.unit_price).toFixed(2)}</div>
                        <div className="col-span-1 text-right text-destructive">{item.discount_percent}%</div>
                        <div className="col-span-1 text-right">{item.tax_percent}%</div>
                        <div className="col-span-2 text-right">
                          {showReceive && remaining > 0 ? (
                            <Input type="number" min={0} max={remaining} step={0.0001}
                              className="h-7 w-full text-xs"
                              placeholder={`0 / ${remaining}`}
                              value={receiveQtys[item.id] || ""}
                              onChange={(e) => setReceiveQtys({ ...receiveQtys, [item.id]: e.target.value })}
                            />
                          ) : showReturn && item.received_quantity > 0 ? (
                            <Input type="number" min={0} max={item.received_quantity} step={0.0001}
                              className="h-7 w-full text-xs border-destructive"
                              placeholder={`0 / ${item.received_quantity}`}
                              value={returnQtys[item.id] || ""}
                              onChange={(e) => setReturnQtys({ ...returnQtys, [item.id]: e.target.value })}
                            />
                          ) : (
                            <span>{item.received_quantity} / {item.quantity}</span>
                          )}
                        </div>
                        <div className="col-span-1 text-right font-medium">${Number(item.line_total).toFixed(2)}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" /> Goods Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {po.receipts && po.receipts.length > 0 ? (
                <div className="space-y-2">
                  {po.receipts.map((r) => (
                    <div key={r.id} className="flex justify-between items-center text-sm rounded-lg border p-3">
                      <div>
                        <span className="font-medium">{r.receipt_number}</span>
                        {r.notes && <span className="text-muted-foreground ml-2">({r.notes})</span>}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(r.received_date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No receipts recorded</p>
              )}
            </CardContent>
          </Card>

          {po.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{po.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Number(po.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-destructive">-${Number(po.discount_total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(po.tax_total).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-base">
                <span>Total</span>
                <span>${Number(po.grand_total).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-green-600">${Number(po.paid_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Balance Due</span>
                <span className="text-destructive">${Number(po.balance_due || po.grand_total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" /> Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency</span>
                <span>{po.currency_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(po.created_at).toLocaleDateString()}</span>
              </div>
              {po.expected_date && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected</span>
                  <span>{new Date(po.expected_date).toLocaleDateString()}</span>
                </div>
              )}
              {po.vendor && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor</span>
                  <button
                    className="text-primary hover:underline text-right"
                    onClick={() => router.push(ROUTES.VENDOR_DETAIL(po.vendor!.id))}
                  >
                    {po.vendor.name}
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
