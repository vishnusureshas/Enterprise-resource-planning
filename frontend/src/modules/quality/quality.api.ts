import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

// ─── Checklists ──────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  sequence: number;
  description: string;
  expected_value?: string;
  min_value?: number;
  max_value?: number;
  unit?: string;
  is_critical: boolean;
  inspection_method?: string;
}

export interface Checklist {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  items: ChecklistItem[];
}

export interface CreateChecklistPayload {
  name: string;
  description?: string | null;
  isActive?: boolean;
  items: Array<{
    sequence?: number;
    description: string;
    expectedValue?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    unit?: string | null;
    isCritical?: boolean;
    inspectionMethod?: string | null;
  }>;
}

export interface UpdateChecklistPayload {
  name?: string;
  description?: string | null;
  isActive?: boolean;
  items?: Array<{
    id?: string | null;
    sequence?: number;
    description: string;
    expectedValue?: string | null;
    minValue?: number | null;
    maxValue?: number | null;
    unit?: string | null;
    isCritical?: boolean;
    inspectionMethod?: string | null;
  }>;
}

// ─── Inspections ──────────────────────────────────────────────────────

export interface InspectionResult {
  id: string;
  checklist_item_id?: string;
  item_description: string;
  actual_value?: string;
  actual_numeric?: number;
  is_pass: boolean;
  notes?: string;
  inspected_by?: string;
  inspected_at: string;
}

export interface Inspection {
  id: string;
  inspection_number: string;
  checklist_id?: string;
  reference_type: string;
  reference_id: string;
  status: string;
  inspected_by?: string;
  inspection_date?: string;
  notes?: string;
  result_summary?: string;
  created_at: string;
  updated_at: string;
  checklist?: { id: string; name: string };
  results: InspectionResult[];
}

export interface CreateInspectionPayload {
  checklistId?: string | null;
  referenceType: string;
  referenceId: string;
  notes?: string | null;
}

export interface RecordResultsPayload {
  results: Array<{
    checklistItemId?: string | null;
    itemDescription: string;
    actualValue?: string | null;
    actualNumeric?: number | null;
    isPass: boolean;
    notes?: string | null;
  }>;
  status: string;
  resultSummary: string;
  notes?: string | null;
}

// ─── Criteria ─────────────────────────────────────────────────────────

export interface InspectionCriterion {
  id: string;
  product_id?: string;
  name: string;
  description?: string;
  min_value?: number;
  max_value?: number;
  unit?: string;
  is_critical: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateCriterionPayload {
  productId?: string | null;
  name: string;
  description?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string | null;
  isCritical?: boolean;
  isActive?: boolean;
}

export interface UpdateCriterionPayload {
  name?: string;
  description?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  unit?: string | null;
  isCritical?: boolean;
  isActive?: boolean;
}

// ─── Reference Items (for dropdown) ──────────────────────────────────

export interface ReferenceItem {
  id: string;
  product_code?: string;
  product_name?: string;
  po_number?: string;
  order_number?: string;
  work_order_number?: string;
  batch_number?: string;
}

export function getReferenceItemLabel(item: ReferenceItem, referenceType: string): string {
  switch (referenceType) {
    case "purchase_order_item":
      return `[${item.po_number}] ${item.product_name}${item.product_code ? ` (${item.product_code})` : ""}`;
    case "work_order_output":
      return `[${item.work_order_number}] ${item.product_name}${item.batch_number ? ` — Batch ${item.batch_number}` : ""}${item.product_code ? ` (${item.product_code})` : ""}`;
    case "sales_order_item":
      return `[${item.order_number}] ${item.product_name}${item.product_code ? ` (${item.product_code})` : ""}`;
    default:
      return item.product_name || item.id;
  }
}

export async function listReferenceItems(referenceType: string): Promise<ReferenceItem[]> {
  const response = await api.get<ApiResponse<ReferenceItem[]>>(`/quality/references/${referenceType}`);
  return response.data.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────

const INSPECTION_STATUSES: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  passed: "Passed",
  failed: "Failed",
  blocked: "Blocked",
};

export function getInspectionStatusLabel(status: string): string {
  return INSPECTION_STATUSES[status] || status;
}

export function getInspectionStatusColor(status: string): "secondary" | "default" | "warning" | "success" | "destructive" {
  switch (status) {
    case "pending": return "secondary";
    case "in_progress": return "default";
    case "passed": return "success";
    case "failed": return "destructive";
    case "blocked": return "destructive";
    default: return "secondary";
  }
}

const REFERENCE_LABELS: Record<string, string> = {
  purchase_order_item: "Purchase Order",
  work_order_output: "Manufacturing Output",
  sales_order_item: "Sales Order",
};

export function getReferenceLabel(type: string): string {
  return REFERENCE_LABELS[type] || type;
}

// ─── API: Checklists ──────────────────────────────────────────────────

export async function listChecklists(params: PaginationParams & { isActive?: string }): Promise<{ data: Checklist[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Checklist[]>>("/quality/checklists", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getChecklist(id: string): Promise<Checklist> {
  const response = await api.get<ApiResponse<Checklist>>(`/quality/checklists/${id}`);
  return response.data.data;
}

export async function createChecklist(data: CreateChecklistPayload): Promise<Checklist> {
  const response = await api.post<ApiResponse<Checklist>>("/quality/checklists", data);
  return response.data.data;
}

export async function updateChecklist(id: string, data: UpdateChecklistPayload): Promise<Checklist> {
  const response = await api.patch<ApiResponse<Checklist>>(`/quality/checklists/${id}`, data);
  return response.data.data;
}

export async function deleteChecklist(id: string): Promise<void> {
  await api.delete(`/quality/checklists/${id}`);
}

// ─── API: Inspections ─────────────────────────────────────────────────

export async function listInspections(params: PaginationParams & { status?: string; referenceType?: string }): Promise<{ data: Inspection[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Inspection[]>>("/quality/inspections", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getInspection(id: string): Promise<Inspection> {
  const response = await api.get<ApiResponse<Inspection>>(`/quality/inspections/${id}`);
  return response.data.data;
}

export async function createInspection(data: CreateInspectionPayload): Promise<Inspection> {
  const response = await api.post<ApiResponse<Inspection>>("/quality/inspections", data);
  return response.data.data;
}

export async function recordResults(id: string, data: RecordResultsPayload): Promise<Inspection> {
  const response = await api.post<ApiResponse<Inspection>>(`/quality/inspections/${id}/results`, data);
  return response.data.data;
}

export async function deleteInspection(id: string): Promise<void> {
  await api.delete(`/quality/inspections/${id}`);
}

// ─── API: Criteria ────────────────────────────────────────────────────

export async function listCriteria(params: PaginationParams & { productId?: string; isActive?: string }): Promise<{ data: InspectionCriterion[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<InspectionCriterion[]>>("/quality/criteria", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getCriterion(id: string): Promise<InspectionCriterion> {
  const response = await api.get<ApiResponse<InspectionCriterion>>(`/quality/criteria/${id}`);
  return response.data.data;
}

export async function createCriterion(data: CreateCriterionPayload): Promise<InspectionCriterion> {
  const response = await api.post<ApiResponse<InspectionCriterion>>("/quality/criteria", data);
  return response.data.data;
}

export async function updateCriterion(id: string, data: UpdateCriterionPayload): Promise<InspectionCriterion> {
  const response = await api.patch<ApiResponse<InspectionCriterion>>(`/quality/criteria/${id}`, data);
  return response.data.data;
}

export async function deleteCriterion(id: string): Promise<void> {
  await api.delete(`/quality/criteria/${id}`);
}
