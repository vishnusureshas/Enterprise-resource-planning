import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

export interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  website?: string;
  notes?: string;
  status: string;
  attributes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  addresses?: CustomerAddress[];
  contacts?: CustomerContact[];
  notes_list?: CustomerNote[];
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  type: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  content: string;
  created_by?: string;
  created_by_name?: string;
  created_at: string;
}

export interface CreateCustomerPayload {
  code: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  taxId?: string | null;
  website?: string | null;
  notes?: string | null;
  status?: string;
  attributes?: Record<string, unknown>;
}

export interface UpdateCustomerPayload {
  code?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
  taxId?: string | null;
  website?: string | null;
  notes?: string | null;
  status?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CreateAddressPayload {
  type?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  isDefault?: boolean;
}

export interface UpdateAddressPayload {
  type?: string;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  isDefault?: boolean;
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

export interface CreateNotePayload {
  content: string;
}

export interface CustomerListParams extends PaginationParams {
  status?: string;
}

export async function listCustomers(params: CustomerListParams): Promise<{ data: Customer[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Customer[]>>("/customers", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getCustomer(id: string): Promise<Customer> {
  const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
  return response.data.data;
}

export async function createCustomer(data: CreateCustomerPayload): Promise<Customer> {
  const response = await api.post<ApiResponse<Customer>>("/customers", data);
  return response.data.data;
}

export async function updateCustomer(id: string, data: UpdateCustomerPayload): Promise<Customer> {
  const response = await api.patch<ApiResponse<Customer>>(`/customers/${id}`, data);
  return response.data.data;
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`);
}

export async function listCustomerAddresses(customerId: string): Promise<CustomerAddress[]> {
  const response = await api.get<ApiResponse<CustomerAddress[]>>(`/customers/${customerId}/addresses`);
  return response.data.data;
}

export async function createCustomerAddress(customerId: string, data: CreateAddressPayload): Promise<CustomerAddress> {
  const response = await api.post<ApiResponse<CustomerAddress>>(`/customers/${customerId}/addresses`, data);
  return response.data.data;
}

export async function updateCustomerAddress(customerId: string, addressId: string, data: UpdateAddressPayload): Promise<CustomerAddress> {
  const response = await api.patch<ApiResponse<CustomerAddress>>(`/customers/${customerId}/addresses/${addressId}`, data);
  return response.data.data;
}

export async function deleteCustomerAddress(customerId: string, addressId: string): Promise<void> {
  await api.delete(`/customers/${customerId}/addresses/${addressId}`);
}

export async function listCustomerContacts(customerId: string): Promise<CustomerContact[]> {
  const response = await api.get<ApiResponse<CustomerContact[]>>(`/customers/${customerId}/contacts`);
  return response.data.data;
}

export async function createCustomerContact(customerId: string, data: CreateContactPayload): Promise<CustomerContact> {
  const response = await api.post<ApiResponse<CustomerContact>>(`/customers/${customerId}/contacts`, data);
  return response.data.data;
}

export async function updateCustomerContact(customerId: string, contactId: string, data: UpdateContactPayload): Promise<CustomerContact> {
  const response = await api.patch<ApiResponse<CustomerContact>>(`/customers/${customerId}/contacts/${contactId}`, data);
  return response.data.data;
}

export async function deleteCustomerContact(customerId: string, contactId: string): Promise<void> {
  await api.delete(`/customers/${customerId}/contacts/${contactId}`);
}

export async function listCustomerNotes(customerId: string): Promise<CustomerNote[]> {
  const response = await api.get<ApiResponse<CustomerNote[]>>(`/customers/${customerId}/notes`);
  return response.data.data;
}

export async function createCustomerNote(customerId: string, data: CreateNotePayload): Promise<CustomerNote> {
  const response = await api.post<ApiResponse<CustomerNote>>(`/customers/${customerId}/notes`, data);
  return response.data.data;
}

export interface CustomerOrder {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  grand_total: number;
  paid_amount?: number;
  balance_due?: number;
  currency_code: string;
  created_at: string;
}

export async function listCustomerOrders(customerId: string, params: PaginationParams): Promise<{ data: CustomerOrder[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<CustomerOrder[]>>(`/customers/${customerId}/orders`, { params });
  return { data: response.data.data, meta: response.data.meta! };
}
