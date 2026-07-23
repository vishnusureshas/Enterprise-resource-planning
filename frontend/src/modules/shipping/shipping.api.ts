import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

// ─── Carriers ─────────────────────────────────────────────────────────

export interface Carrier {
  id: string;
  code: string;
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  tracking_url_template?: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface CreateCarrierPayload {
  code: string;
  name: string;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  trackingUrlTemplate?: string | null;
  status?: "active" | "inactive";
}

export interface UpdateCarrierPayload {
  code?: string;
  name?: string;
  description?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  trackingUrlTemplate?: string | null;
  status?: "active" | "inactive";
}

// ─── Shipments ────────────────────────────────────────────────────────

export type ShipmentStatus = "draft" | "pending" | "dispatched" | "in_transit" | "delivered" | "failed" | "returned";

export interface ShipmentItem {
  id: string;
  product_id?: string;
  sales_order_item_id?: string;
  quantity: number;
  unit_weight?: number;
  product?: { id: string; name: string; sku: string };
}

export interface TrackingEvent {
  id: string;
  status: string;
  location?: string;
  description?: string;
  occurred_at: string;
  created_at: string;
}

export interface Shipment {
  id: string;
  shipment_number: string;
  sales_order_id?: string;
  carrier_id?: string;
  carrier_tracking_number?: string;
  status: ShipmentStatus;
  origin_address?: string;
  destination_address?: string;
  shipped_date?: string;
  estimated_delivery_date?: string;
  actual_delivery_date?: string;
  total_weight?: number;
  weight_unit: string;
  total_value?: number;
  shipping_cost?: number;
  currency: string;
  notes?: string;
  carrier?: { id: string; name: string; code: string; tracking_url_template?: string };
  sales_order?: { id: string; order_number: string };
  items: ShipmentItem[];
  tracking: TrackingEvent[];
  created_at: string;
  updated_at: string;
}

export interface CreateShipmentPayload {
  salesOrderId?: string | null;
  carrierId?: string | null;
  carrierTrackingNumber?: string | null;
  originAddress?: string | null;
  destinationAddress?: string | null;
  estimatedDeliveryDate?: string | null;
  totalWeight?: number | null;
  weightUnit?: string;
  totalValue?: number | null;
  shippingCost?: number | null;
  currency?: string;
  notes?: string | null;
  items?: Array<{
    productId?: string | null;
    salesOrderItemId?: string | null;
    quantity: number;
    unitWeight?: number | null;
  }>;
}

export interface UpdateShipmentPayload {
  carrierId?: string | null;
  carrierTrackingNumber?: string | null;
  originAddress?: string | null;
  destinationAddress?: string | null;
  estimatedDeliveryDate?: string | null;
  totalWeight?: number | null;
  weightUnit?: string;
  totalValue?: number | null;
  shippingCost?: number | null;
  currency?: string;
  notes?: string | null;
}

export interface TrackingEventPayload {
  status: string;
  location?: string | null;
  description?: string | null;
  occurredAt?: string;
}

export interface RateRequest {
  originPostalCode?: string | null;
  destinationPostalCode: string;
  destinationCountry: string;
  weight: number;
  weightUnit?: string;
  value?: number | null;
}

export interface Rate {
  carrier: string;
  service: string;
  rate: number;
  currency: string;
  estimatedDays: string;
}

// ─── API Functions ────────────────────────────────────────────────────

export async function listCarriers(params: PaginationParams & { search?: string; status?: string } = {}): Promise<{
  data: Carrier[];
  meta: PaginationMeta;
}> {
  const res = await api.get<ApiResponse<Carrier[]>>("/shipping/carriers", { params });
  return { data: res.data.data, meta: res.data.meta! };
}

export async function getCarrier(id: string): Promise<Carrier> {
  const res = await api.get<ApiResponse<Carrier>>(`/shipping/carriers/${id}`);
  return res.data.data;
}

export async function createCarrier(data: CreateCarrierPayload): Promise<Carrier> {
  const res = await api.post<ApiResponse<Carrier>>("/shipping/carriers", data);
  return res.data.data;
}

export async function updateCarrier(id: string, data: UpdateCarrierPayload): Promise<Carrier> {
  const res = await api.patch<ApiResponse<Carrier>>(`/shipping/carriers/${id}`, data);
  return res.data.data;
}

export async function deleteCarrier(id: string): Promise<void> {
  await api.delete(`/shipping/carriers/${id}`);
}

export async function listShipments(params: PaginationParams & {
  search?: string; status?: string; carrierId?: string; salesOrderId?: string;
} = {}): Promise<{ data: Shipment[]; meta: PaginationMeta }> {
  const res = await api.get<ApiResponse<Shipment[]>>("/shipping/shipments", { params });
  return { data: res.data.data, meta: res.data.meta! };
}

export async function getShipment(id: string): Promise<Shipment> {
  const res = await api.get<ApiResponse<Shipment>>(`/shipping/shipments/${id}`);
  return res.data.data;
}

export async function createShipment(data: CreateShipmentPayload): Promise<Shipment> {
  const res = await api.post<ApiResponse<Shipment>>("/shipping/shipments", data);
  return res.data.data;
}

export async function updateShipment(id: string, data: UpdateShipmentPayload): Promise<Shipment> {
  const res = await api.patch<ApiResponse<Shipment>>(`/shipping/shipments/${id}`, data);
  return res.data.data;
}

export async function dispatchShipment(id: string): Promise<Shipment> {
  const res = await api.post<ApiResponse<Shipment>>(`/shipping/shipments/${id}/dispatch`);
  return res.data.data;
}

export async function deliverShipment(id: string): Promise<Shipment> {
  const res = await api.post<ApiResponse<Shipment>>(`/shipping/shipments/${id}/deliver`);
  return res.data.data;
}

export async function addTrackingEvent(id: string, data: TrackingEventPayload): Promise<TrackingEvent> {
  const res = await api.post<ApiResponse<TrackingEvent>>(`/shipping/shipments/${id}/tracking`, data);
  return res.data.data;
}

export async function trackShipment(trackingNumber: string): Promise<Shipment> {
  const res = await api.get<ApiResponse<Shipment>>(`/shipping/tracking/${trackingNumber}`);
  return res.data.data;
}

export async function deleteShipment(id: string): Promise<void> {
  await api.delete(`/shipping/shipments/${id}`);
}

export async function calculateRates(data: RateRequest): Promise<Rate[]> {
  const res = await api.post<ApiResponse<Rate[]>>("/shipping/rates", data);
  return res.data.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────

export function getShipmentStatusLabel(status: ShipmentStatus | string): string {
  const labels: Record<string, string> = {
    draft: "Draft", pending: "Pending", dispatched: "Dispatched",
    in_transit: "In Transit", delivered: "Delivered", failed: "Failed", returned: "Returned",
  };
  return labels[status] || status;
}

export function getShipmentStatusColor(status: ShipmentStatus | string): string {
  const colors: Record<string, string> = {
    draft: "secondary", pending: "warning", dispatched: "default",
    in_transit: "default", delivered: "success", failed: "destructive", returned: "outline",
  };
  return colors[status] || "secondary";
}
