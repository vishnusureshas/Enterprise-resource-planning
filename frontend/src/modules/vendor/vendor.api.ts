import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

export interface Vendor {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  website?: string;
  payment_terms?: string;
  credit_limit?: number;
  notes?: string;
  status: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  contacts?: VendorContact[];
  contracts?: VendorContract[];
}

export interface VendorContact {
  id: string;
  vendor_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorContract {
  id: string;
  vendor_id: string;
  title: string;
  contract_number?: string;
  start_date?: string;
  end_date?: string;
  value?: number;
  terms?: string;
  status: string;
  file_url?: string;
  created_by?: string;
  created_by_user?: { id: string; name: string };
  created_at: string;
  updated_at: string;
}

export interface CreateVendorPayload {
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  taxId?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  notes?: string | null;
  status?: string;
  attributes?: Record<string, unknown>;
}

export interface UpdateVendorPayload {
  code?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  taxId?: string | null;
  website?: string | null;
  paymentTerms?: string | null;
  creditLimit?: number | null;
  notes?: string | null;
  status?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateContactPayload {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  isPrimary?: boolean;
}

export interface UpdateContactPayload {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  position?: string | null;
  isPrimary?: boolean;
}

export interface CreateContractPayload {
  title: string;
  contractNumber?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  value?: number | null;
  terms?: string | null;
  status?: string;
  fileUrl?: string | null;
}

export interface UpdateContractPayload {
  title?: string;
  contractNumber?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  value?: number | null;
  terms?: string | null;
  status?: string;
  fileUrl?: string | null;
}

export interface VendorListParams extends PaginationParams {
  status?: string;
}

export async function listVendors(params: VendorListParams): Promise<{ data: Vendor[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Vendor[]>>("/vendors", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getVendor(id: string): Promise<Vendor> {
  const response = await api.get<ApiResponse<Vendor>>(`/vendors/${id}`);
  return response.data.data;
}

export async function createVendor(data: CreateVendorPayload): Promise<Vendor> {
  const response = await api.post<ApiResponse<Vendor>>("/vendors", data);
  return response.data.data;
}

export async function updateVendor(id: string, data: UpdateVendorPayload): Promise<Vendor> {
  const response = await api.patch<ApiResponse<Vendor>>(`/vendors/${id}`, data);
  return response.data.data;
}

export async function deleteVendor(id: string): Promise<void> {
  await api.delete(`/vendors/${id}`);
}

export async function listVendorContacts(vendorId: string): Promise<VendorContact[]> {
  const response = await api.get<ApiResponse<VendorContact[]>>(`/vendors/${vendorId}/contacts`);
  return response.data.data;
}

export async function createVendorContact(vendorId: string, data: CreateContactPayload): Promise<VendorContact> {
  const response = await api.post<ApiResponse<VendorContact>>(`/vendors/${vendorId}/contacts`, data);
  return response.data.data;
}

export async function updateVendorContact(vendorId: string, contactId: string, data: UpdateContactPayload): Promise<VendorContact> {
  const response = await api.patch<ApiResponse<VendorContact>>(`/vendors/${vendorId}/contacts/${contactId}`, data);
  return response.data.data;
}

export async function deleteVendorContact(vendorId: string, contactId: string): Promise<void> {
  await api.delete(`/vendors/${vendorId}/contacts/${contactId}`);
}

export async function listVendorContracts(vendorId: string): Promise<VendorContract[]> {
  const response = await api.get<ApiResponse<VendorContract[]>>(`/vendors/${vendorId}/contracts`);
  return response.data.data;
}

export async function createVendorContract(vendorId: string, data: CreateContractPayload): Promise<VendorContract> {
  const response = await api.post<ApiResponse<VendorContract>>(`/vendors/${vendorId}/contracts`, data);
  return response.data.data;
}

export async function updateVendorContract(vendorId: string, contractId: string, data: UpdateContractPayload): Promise<VendorContract> {
  const response = await api.patch<ApiResponse<VendorContract>>(`/vendors/${vendorId}/contracts/${contractId}`, data);
  return response.data.data;
}

export async function deleteVendorContract(vendorId: string, contractId: string): Promise<void> {
  await api.delete(`/vendors/${vendorId}/contracts/${contractId}`);
}

export interface VendorPurchaseOrder {
  id: string;
  po_number: string;
  status: string;
  order_date: string;
  grand_total: number;
}

export async function listVendorPurchaseOrders(vendorId: string): Promise<{ data: VendorPurchaseOrder[]; total: number }> {
  const response = await api.get<ApiResponse<VendorPurchaseOrder[]>>(`/vendors/${vendorId}/purchase-orders`);
  return { data: response.data.data, total: response.data.meta?.total || 0 };
}
