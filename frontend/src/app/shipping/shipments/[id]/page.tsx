"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  getShipment, dispatchShipment, deliverShipment, addTrackingEvent, deleteShipment,
  getShipmentStatusLabel, getShipmentStatusColor,
  type Shipment, type TrackingEventPayload,
} from "@/modules/shipping/shipping.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { Package, ArrowLeft, Truck,CheckCircle2, MapPin, Clock, Trash2 } from "lucide-react";

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [trackingEvent, setTrackingEvent] = useState<TrackingEventPayload>({ status: "", description: "" });
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: shipment, isLoading, isError } = useQuery({
    queryKey: CACHE_KEYS.SHIPPING_SHIPMENT(id),
    queryFn: () => getShipment(id),
  });

  const dispatchMut = useMutation({
    mutationFn: () => dispatchShipment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_SHIPMENT(id) }); queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_SHIPMENTS }); toast({ title: "Shipment dispatched", variant: "success" }); },
    onError: () => toast({ title: "Failed to dispatch", variant: "destructive" }),
  });

  const deliverMut = useMutation({
    mutationFn: () => deliverShipment(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_SHIPMENT(id) }); toast({ title: "Shipment delivered", variant: "success" }); },
    onError: () => toast({ title: "Failed to deliver", variant: "destructive" }),
  });

  const trackingMut = useMutation({
    mutationFn: (d: TrackingEventPayload) => addTrackingEvent(id, d),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_SHIPMENT(id) }); setShowTrackingForm(false); setTrackingEvent({ status: "", description: "" }); toast({ title: "Tracking event added", variant: "success" }); },
    onError: () => toast({ title: "Failed to add event", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteShipment(id),
    onSuccess: () => { router.push(ROUTES.SHIPPING_SHIPMENTS); toast({ title: "Shipment deleted", variant: "success" }); },
    onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !shipment) return <p className="text-destructive">Failed to load shipment</p>;

  const canDispatch = shipment.status === "draft" || shipment.status === "pending";
  const canDeliver = shipment.status === "dispatched" || shipment.status === "in_transit";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.SHIPPING_SHIPMENTS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{shipment.shipment_number}</h2>
              <Badge variant={getShipmentStatusColor(shipment.status) as any}>{getShipmentStatusLabel(shipment.status)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {shipment.carrier?.name ? `via ${shipment.carrier.name}` : ""}
              {shipment.carrier_tracking_number ? ` — Tracking: ${shipment.carrier_tracking_number}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canDispatch && <Button onClick={() => dispatchMut.mutate()} disabled={dispatchMut.isPending}><Truck className="mr-1 h-4 w-4" />Dispatch</Button>}
          {canDeliver && <Button onClick={() => deliverMut.mutate()} disabled={deliverMut.isPending} className="bg-green-600 hover:bg-green-700"><CheckCircle2 className="mr-1 h-4 w-4" />Deliver</Button>}
          <Button variant="destructive" size="icon" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Addresses</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-muted-foreground text-xs">Origin</p>
              <p>{shipment.origin_address || "—"}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground text-xs">Destination</p>
              <p>{shipment.destination_address || "—"}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> Dates</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="font-medium text-muted-foreground text-xs">Shipped</p><p>{shipment.shipped_date ? new Date(shipment.shipped_date).toLocaleDateString() : "—"}</p></div>
              <div><p className="font-medium text-muted-foreground text-xs">Est. Delivery</p><p>{shipment.estimated_delivery_date ? new Date(shipment.estimated_delivery_date).toLocaleDateString() : "—"}</p></div>
              <div><p className="font-medium text-muted-foreground text-xs">Actual Delivery</p><p>{shipment.actual_delivery_date ? new Date(shipment.actual_delivery_date).toLocaleDateString() : "—"}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm font-medium">Items ({shipment.items?.length || 0})</CardTitle></CardHeader>
        <CardContent>
          {shipment.items && shipment.items.length > 0 ? (
            <div className="divide-y text-sm">
              {shipment.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2">
                  <span className="font-medium">{item.product?.name || item.product_id || "—"}</span>
                  <span className="text-muted-foreground">Qty: {item.quantity}{item.unit_weight ? ` × ${item.unit_weight}kg` : ""}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No items</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2"><Truck className="h-4 w-4" /> Tracking Events</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowTrackingForm(!showTrackingForm)}>
            {showTrackingForm ? "Cancel" : "Add Event"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {showTrackingForm && (
            <div className="rounded-lg border p-3 space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Status *</Label>
                  <Input className="h-8 text-xs" value={trackingEvent.status}
                    onChange={(e) => setTrackingEvent({ ...trackingEvent, status: e.target.value })} placeholder="e.g. arrived_at_hub" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Location</Label>
                  <Input className="h-8 text-xs" value={trackingEvent.location || ""}
                    onChange={(e) => setTrackingEvent({ ...trackingEvent, location: e.target.value })} placeholder="City, State" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input className="h-8 text-xs" value={trackingEvent.description || ""}
                  onChange={(e) => setTrackingEvent({ ...trackingEvent, description: e.target.value })} placeholder="Package arrived at sorting facility" />
              </div>
              <Button size="sm" disabled={!trackingEvent.status || trackingMut.isPending}
                onClick={() => trackingMut.mutate(trackingEvent)}>
                {trackingMut.isPending ? "Adding..." : "Add Event"}
              </Button>
            </div>
          )}
          {shipment.tracking && shipment.tracking.length > 0 ? (
            <div className="space-y-0">
              {shipment.tracking.map((event) => (
                <div key={event.id} className="flex gap-3 border-l-2 border-primary/30 pl-4 pb-4 last:pb-0">
                  <div className="flex flex-col">
                    <p className="text-sm font-medium capitalize">{event.status.replace(/_/g, " ")}</p>
                    {event.location && <p className="text-xs text-muted-foreground">{event.location}</p>}
                    {event.description && <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{new Date(event.occurred_at).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">No tracking events</p>}
        </CardContent>
      </Card>

      <Separator />
      <div className="grid grid-cols-3 gap-4 text-sm max-w-md">
        <div><span className="text-muted-foreground">Weight</span><p>{shipment.total_weight ? `${shipment.total_weight} ${shipment.weight_unit}` : "—"}</p></div>
        <div><span className="text-muted-foreground">Value</span><p>{shipment.total_value ? `$${Number(shipment.total_value).toFixed(2)}` : "—"}</p></div>
        <div><span className="text-muted-foreground">Cost</span><p>{shipment.shipping_cost ? `$${Number(shipment.shipping_cost).toFixed(2)}` : "—"}</p></div>
      </div>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen}
        title="Delete Shipment" description="Are you sure?" variant="destructive"
        onConfirm={() => deleteMut.mutate()} isLoading={deleteMut.isPending} />
    </div>
  );
}
