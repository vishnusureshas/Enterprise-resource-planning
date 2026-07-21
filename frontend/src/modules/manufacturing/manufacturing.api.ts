import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

// ─── Work Centers ─────────────────────────────────────────────────────

export interface WorkCenter {
  id: string;
  name: string;
  code: string;
  description?: string;
  capacity_per_shift: number;
  operating_hours: Record<string, { start: string; end: string }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkCenterPayload {
  name: string;
  code: string;
  description?: string | null;
  capacityPerShift?: number;
  operatingHours?: Record<string, { start: string; end: string }>;
  isActive?: boolean;
}

export interface UpdateWorkCenterPayload {
  name?: string;
  code?: string;
  description?: string | null;
  capacityPerShift?: number;
  operatingHours?: Record<string, { start: string; end: string }>;
  isActive?: boolean;
}

// ─── BOM ──────────────────────────────────────────────────────────────

export interface BomItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost?: number;
  sequence: number;
  notes?: string;
  product: { id: string; name: string; sku: string };
}

export interface Bom {
  id: string;
  product_id: string;
  name: string;
  version: number;
  quantity: number;
  is_active: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  product: { id: string; name: string; sku: string };
  items: BomItem[];
}

export interface CreateBomPayload {
  productId: string;
  name: string;
  version?: number;
  quantity?: number;
  isActive?: boolean;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    unitCost?: number | null;
    sequence?: number;
    notes?: string | null;
  }>;
}

export interface UpdateBomPayload {
  name?: string;
  version?: number;
  quantity?: number;
  isActive?: boolean;
  notes?: string | null;
  items?: Array<{
    productId: string;
    quantity: number;
    unitCost?: number | null;
    sequence?: number;
    notes?: string | null;
  }>;
}

export interface BomExplosionItem {
  id: string;
  bom_id: string;
  product_id: string;
  qty_per_parent: number;
  total_quantity: number;
  level: number;
  product_name: string;
  product_sku: string;
  unit_cost?: number;
}

// ─── Work Orders ──────────────────────────────────────────────────────

export interface WorkOrder {
  id: string;
  work_order_number: string;
  product_id: string;
  bom_id?: string;
  work_center_id?: string;
  quantity: number;
  quantity_produced: number;
  quantity_scrapped: number;
  priority: string;
  status: string;
  start_date?: string;
  due_date?: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  product: { id: string; name: string; sku: string };
  work_center?: { id: string; name: string };
  bom?: { id: string; name: string };
  operations: WorkOrderOperation[];
  consumptions: WorkOrderConsumption[];
  outputs: WorkOrderOutput[];
}

export interface WorkOrderOperation {
  id: string;
  sequence: number;
  name: string;
  work_center_id?: string;
  planned_duration_minutes?: number;
  actual_duration_minutes?: number;
  status: string;
  start_time?: string;
  end_time?: string;
  work_center?: { id: string; name: string };
}

export interface WorkOrderConsumption {
  id: string;
  product_id: string;
  quantity_planned: number;
  quantity_actual: number;
  warehouse_stock_id?: string;
  unit_cost?: number;
  notes?: string;
  product: { id: string; name: string; sku: string };
}

export interface WorkOrderOutput {
  id: string;
  product_id: string;
  quantity: number;
  warehouse_stock_id?: string;
  batch_number?: string;
  is_defective: boolean;
  notes?: string;
  product: { id: string; name: string; sku: string };
}

export interface CreateWorkOrderPayload {
  productId: string;
  bomId?: string | null;
  workCenterId?: string | null;
  quantity: number;
  priority?: string;
  startDate?: string | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface ConsumePayload {
  productId: string;
  quantityActual: number;
  warehouseStockId?: string | null;
  notes?: string | null;
}

export interface OutputPayload {
  productId: string;
  quantity: number;
  warehouseStockId?: string | null;
  batchNumber?: string | null;
  isDefective?: boolean;
  notes?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const WO_STATUSES: Record<string, string> = {
  draft: "Draft",
  planned: "Planned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getWoStatusLabel(status: string): string {
  return WO_STATUSES[status] || status;
}

export function getWoStatusColor(status: string): "secondary" | "default" | "warning" | "success" | "destructive" {
  switch (status) {
    case "draft": return "secondary";
    case "planned": return "default";
    case "in_progress": return "warning";
    case "completed": return "success";
    case "cancelled": return "destructive";
    default: return "secondary";
  }
}

const PRIORITIES: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export function getPriorityLabel(p: string): string {
  return PRIORITIES[p] || p;
}

export function getPriorityColor(p: string): "secondary" | "default" | "warning" | "destructive" {
  switch (p) {
    case "low": return "secondary";
    case "medium": return "default";
    case "high": return "warning";
    case "urgent": return "destructive";
    default: return "secondary";
  }
}

// ─── API Functions ────────────────────────────────────────────────────

// Work Centers
export async function listWorkCenters(params: PaginationParams): Promise<{ data: WorkCenter[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<WorkCenter[]>>("/manufacturing/work-centers", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getWorkCenter(id: string): Promise<WorkCenter> {
  const response = await api.get<ApiResponse<WorkCenter>>(`/manufacturing/work-centers/${id}`);
  return response.data.data;
}

export async function createWorkCenter(data: CreateWorkCenterPayload): Promise<WorkCenter> {
  const response = await api.post<ApiResponse<WorkCenter>>("/manufacturing/work-centers", data);
  return response.data.data;
}

export async function updateWorkCenter(id: string, data: UpdateWorkCenterPayload): Promise<WorkCenter> {
  const response = await api.patch<ApiResponse<WorkCenter>>(`/manufacturing/work-centers/${id}`, data);
  return response.data.data;
}

export async function deleteWorkCenter(id: string): Promise<void> {
  await api.delete(`/manufacturing/work-centers/${id}`);
}

// BOM
export async function listBoms(params: PaginationParams & { productId?: string; isActive?: string }): Promise<{ data: Bom[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Bom[]>>("/manufacturing/bom", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getBom(id: string): Promise<Bom> {
  const response = await api.get<ApiResponse<Bom>>(`/manufacturing/bom/${id}`);
  return response.data.data;
}

export async function createBom(data: CreateBomPayload): Promise<Bom> {
  const response = await api.post<ApiResponse<Bom>>("/manufacturing/bom", data);
  return response.data.data;
}

export async function updateBom(id: string, data: UpdateBomPayload): Promise<Bom> {
  const response = await api.patch<ApiResponse<Bom>>(`/manufacturing/bom/${id}`, data);
  return response.data.data;
}

export async function deleteBom(id: string): Promise<void> {
  await api.delete(`/manufacturing/bom/${id}`);
}

export async function explodeBom(id: string): Promise<BomExplosionItem[]> {
  const response = await api.get<ApiResponse<BomExplosionItem[]>>(`/manufacturing/bom/${id}/explode`);
  return response.data.data;
}

// Work Orders
export async function listWorkOrders(params: PaginationParams & { status?: string; productId?: string }): Promise<{ data: WorkOrder[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<WorkOrder[]>>("/manufacturing/work-orders", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getWorkOrder(id: string): Promise<WorkOrder> {
  const response = await api.get<ApiResponse<WorkOrder>>(`/manufacturing/work-orders/${id}`);
  return response.data.data;
}

export async function createWorkOrder(data: CreateWorkOrderPayload): Promise<WorkOrder> {
  const response = await api.post<ApiResponse<WorkOrder>>("/manufacturing/work-orders", data);
  return response.data.data;
}

export async function updateWorkOrderStatus(id: string, status: string): Promise<WorkOrder> {
  const response = await api.patch<ApiResponse<WorkOrder>>(`/manufacturing/work-orders/${id}/status`, { status });
  return response.data.data;
}

export async function startProduction(id: string): Promise<WorkOrder> {
  const response = await api.post<ApiResponse<WorkOrder>>(`/manufacturing/work-orders/${id}/start`);
  return response.data.data;
}

export async function completeProduction(id: string): Promise<WorkOrder> {
  const response = await api.post<ApiResponse<WorkOrder>>(`/manufacturing/work-orders/${id}/complete`);
  return response.data.data;
}

export async function recordConsumption(id: string, data: ConsumePayload): Promise<WorkOrderConsumption> {
  const response = await api.post<ApiResponse<WorkOrderConsumption>>(`/manufacturing/work-orders/${id}/consume`, data);
  return response.data.data;
}

export async function recordOutput(id: string, data: OutputPayload): Promise<WorkOrderOutput> {
  const response = await api.post<ApiResponse<WorkOrderOutput>>(`/manufacturing/work-orders/${id}/output`, data);
  return response.data.data;
}
