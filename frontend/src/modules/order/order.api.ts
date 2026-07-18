import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

export interface SalesOrder {
  id: string;
  organization_id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  status: OrderStatus;
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
  shipping_address_id?: string;
  billing_address_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  customer?: { id: string; name: string; code: string; email?: string; phone?: string };
  items?: SalesOrderItem[];
  payments?: SalesOrderPayment[];
  taxes?: SalesOrderTax[];
}

export type OrderStatus = "draft" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "returned";

export interface SalesOrderItem {
  id: string;
  sales_order_id: string;
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
  line_total: number;
  created_at: string;
  product?: { id: string; sku: string; name: string };
}

export interface SalesOrderPayment {
  id: string;
  sales_order_id: string;
  amount: number;
  payment_method?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  created_by_user?: { id: string; name: string };
}

export interface SalesOrderTax {
  id: string;
  sales_order_id: string;
  name: string;
  rate: number;
  amount: number;
  created_at: string;
}

export interface CreateOrderPayload {
  customerId: string;
  orderDate?: string;
  currencyCode?: string;
  exchangeRate?: number;
  shippingTotal?: number;
  notes?: string | null;
  shippingAddressId?: string | null;
  billingAddressId?: string | null;
  items: CreateOrderItemPayload[];
}

export interface CreateOrderItemPayload {
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  taxPercent?: number;
}

export interface RecordPaymentPayload {
  amount: number;
  paymentMethod?: string | null;
  referenceNumber?: string | null;
  notes?: string | null;
}

export interface OrderListParams extends PaginationParams {
  status?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

export function getOrderStatusLabel(status: OrderStatus | string): string {
  const labels: Record<string, string> = {
    draft: "Draft",
    confirmed: "Confirmed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };
  return labels[status] || status;
}

export function getOrderStatusColor(status: OrderStatus | string): "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | undefined {
  const colors: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
    draft: "secondary",
    confirmed: "default",
    processing: "warning",
    shipped: "default",
    delivered: "success",
    cancelled: "destructive",
    returned: "destructive",
  };
  return colors[status];
}

export async function listOrders(params: OrderListParams): Promise<{ data: SalesOrder[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<SalesOrder[]>>("/orders", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getOrder(id: string): Promise<SalesOrder> {
  const response = await api.get<ApiResponse<SalesOrder>>(`/orders/${id}`);
  return response.data.data;
}

export async function createOrder(data: CreateOrderPayload): Promise<SalesOrder> {
  const response = await api.post<ApiResponse<SalesOrder>>("/orders", data);
  return response.data.data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<SalesOrder> {
  const response = await api.patch<ApiResponse<SalesOrder>>(`/orders/${id}/status`, { status });
  return response.data.data;
}

export async function cancelOrder(id: string, reason?: string): Promise<SalesOrder> {
  const response = await api.post<ApiResponse<SalesOrder>>(`/orders/${id}/cancel`, { reason });
  return response.data.data;
}

export async function recordPayment(id: string, data: RecordPaymentPayload): Promise<SalesOrderPayment> {
  const response = await api.post<ApiResponse<SalesOrderPayment>>(`/orders/${id}/payments`, data);
  return response.data.data;
}

export async function getOrderTimeline(id: string): Promise<{ event: string; date: string }[]> {
  const response = await api.get<ApiResponse<{ event: string; date: string }[]>>(`/orders/${id}/timeline`);
  return response.data.data;
}

export async function getOrderDeliveries(id: string): Promise<unknown[]> {
  const response = await api.get<ApiResponse<unknown[]>>(`/orders/${id}/deliveries`);
  return response.data.data;
}
