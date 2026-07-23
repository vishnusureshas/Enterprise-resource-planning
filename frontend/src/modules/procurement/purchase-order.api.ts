import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  po_number: string;
  vendor_id: string;
  order_date: string;
  expected_date?: string;
  status: PoStatus;
  currency_code: string;
  exchange_rate: number;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  paid_amount?: number;
  balance_due?: number;
  notes?: string;
  shipping_address?: string;
  billing_address?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  vendor?: { id: string; name: string; code: string; email?: string; phone?: string };
  items?: PurchaseOrderItem[];
  taxes?: PurchaseOrderTax[];
  receipts?: GoodsReceipt[];
}

export type PoStatus = "draft" | "pending" | "approved" | "ordered" | "partial" | "received" | "cancelled";

export interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  product_id: string;
  variant_id?: string;
  product_code?: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  received_quantity: number;
  line_total: number;
  created_at: string;
  product?: { id: string; sku: string; name: string };
}

export interface PurchaseOrderTax {
  id: string;
  purchase_order_id: string;
  name: string;
  rate: number;
  amount: number;
  created_at: string;
}

export interface GoodsReceipt {
  id: string;
  purchase_order_id: string;
  receipt_number: string;
  received_date: string;
  notes?: string;
  created_by?: string;
  created_by_user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface CreatePurchaseOrderPayload {
  vendorId: string;
  orderDate?: string;
  expectedDate?: string | null;
  currencyCode?: string;
  exchangeRate?: number;
  shippingTotal?: number;
  notes?: string | null;
  shippingAddress?: string | null;
  billingAddress?: string | null;
  items: CreatePurchaseOrderItemPayload[];
}

export interface CreatePurchaseOrderItemPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface ReceiveGoodsPayload {
  receivedDate?: string;
  notes?: string | null;
  items: {
    purchaseOrderItemId: string;
    productId: string;
    quantity: number;
  }[];
}

export interface PurchaseOrderListParams extends PaginationParams {
  status?: string;
  vendorId?: string;
  fromDate?: string;
  toDate?: string;
}

export function getPoStatusLabel(status: PoStatus | string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    pending: "Pending",
    approved: "Approved",
    ordered: "Ordered",
    partial: "Partially Received",
    received: "Received",
    cancelled: "Cancelled",
  };
  return labels[status] || status;
}

export function getPoStatusColor(status: PoStatus | string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | undefined {
  const colors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
    draft: "secondary",
    pending: "default",
    approved: "default",
    ordered: "warning",
    partial: "warning",
    received: "success",
    cancelled: "destructive",
  };
  return colors[status];
}

export async function listPurchaseOrders(params: PurchaseOrderListParams): Promise<{ data: PurchaseOrder[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<PurchaseOrder[]>>("/purchase-orders", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const response = await api.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
  return response.data.data;
}

export async function createPurchaseOrder(data: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
  const response = await api.post<ApiResponse<PurchaseOrder>>("/purchase-orders", data);
  return response.data.data;
}

export async function updatePurchaseOrderStatus(id: string, status: PoStatus): Promise<PurchaseOrder> {
  const response = await api.patch<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/status`, { status });
  return response.data.data;
}

export async function receiveGoods(id: string, data: ReceiveGoodsPayload): Promise<GoodsReceipt> {
  const response = await api.post<ApiResponse<GoodsReceipt>>(`/purchase-orders/${id}/receive`, data);
  return response.data.data;
}

export async function getReceipt(id: string, receiptId: string): Promise<GoodsReceipt & { items: never[] }> {
  const response = await api.get<ApiResponse<GoodsReceipt & { items: never[] }>>(`/purchase-orders/${id}/receipts/${receiptId}`);
  return response.data.data;
}

export interface ReturnToVendorPayload {
  returnDate?: string;
  notes?: string | null;
  items: {
    purchaseOrderItemId: string;
    productId: string;
    quantity: number;
    reason?: string;
  }[];
}

export async function returnPurchaseOrder(id: string, data: ReturnToVendorPayload): Promise<GoodsReceipt> {
  const response = await api.post<ApiResponse<GoodsReceipt>>(`/purchase-orders/${id}/return`, data);
  return response.data.data;
}

export async function getPurchaseOrderTimeline(id: string): Promise<{ event: string; date: string }[]> {
  const response = await api.get<ApiResponse<{ event: string; date: string }[]>>(`/purchase-orders/${id}/timeline`);
  return response.data.data;
}
