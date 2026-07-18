import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

export interface InventoryCategory {
  id: string;
  parent_id?: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  parent?: { id: string; name: string } | null;
}

export interface CreateCategoryPayload {
  parentId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryPayload {
  parentId?: string | null;
  name?: string;
  slug?: string;
  description?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface Product {
  id: string;
  category_id?: string;
  sku: string;
  name: string;
  description?: string;
  unit_of_measure: string;
  unit_price: number;
  cost_price: number;
  reorder_point: number;
  reorder_quantity: number;
  weight?: number;
  weight_unit: string;
  is_active: boolean;
  is_serialized: boolean;
  is_batched: boolean;
  track_inventory: boolean;
  attributes: Record<string, unknown>;
  image_url?: string;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string } | null;
  variants?: ProductVariant[];
}

export interface CreateProductPayload {
  categoryId?: string | null;
  sku: string;
  name: string;
  description?: string | null;
  unitOfMeasure?: string;
  unitPrice?: number;
  costPrice?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  weight?: number | null;
  weightUnit?: string;
  isActive?: boolean;
  isSerialized?: boolean;
  isBatched?: boolean;
  trackInventory?: boolean;
  attributes?: Record<string, unknown>;
  imageUrl?: string | null;
}

export interface UpdateProductPayload {
  categoryId?: string | null;
  sku?: string;
  name?: string;
  description?: string | null;
  unitOfMeasure?: string;
  unitPrice?: number;
  costPrice?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  weight?: number | null;
  weightUnit?: string;
  isActive?: boolean;
  isSerialized?: boolean;
  isBatched?: boolean;
  trackInventory?: boolean;
  attributes?: Record<string, unknown>;
  imageUrl?: string | null;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string;
  options: Record<string, string>;
  unit_price?: number;
  cost_price?: number;
  weight?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateVariantPayload {
  sku: string;
  name: string;
  options: Record<string, string>;
  unitPrice?: number | null;
  costPrice?: number | null;
  weight?: number | null;
  isActive?: boolean;
}

export interface UpdateVariantPayload {
  sku?: string;
  name?: string;
  options?: Record<string, string>;
  unitPrice?: number | null;
  costPrice?: number | null;
  weight?: number | null;
  isActive?: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWarehousePayload {
  code: string;
  name: string;
  description?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdateWarehousePayload {
  code?: string;
  name?: string;
  description?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface StockItem {
  id: string;
  warehouse_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  reserved_quantity: number;
  min_quantity?: number;
  max_quantity?: number;
  unit_cost?: number;
  updated_at: string;
  warehouse: { id: string; code: string; name: string };
  product: { id: string; sku: string; name: string };
}

export interface TransferStockPayload {
  fromWarehouseId: string;
  toWarehouseId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  notes?: string | null;
}

export interface AdjustStockPayload {
  warehouseId: string;
  productId: string;
  variantId?: string | null;
  newQuantity: number;
  reason: string;
}

export interface StockMovement {
  id: string;
  organization_id: string;
  warehouse_id: string;
  product_id: string;
  variant_id?: string;
  movement_type: string;
  quantity: number;
  reference_type?: string;
  reference_id?: string;
  unit_cost?: number;
  notes?: string;
  created_by?: string;
  created_at: string;
  warehouse: { id: string; name: string };
  product: { id: string; sku: string; name: string };
  created_by_user?: { id: string; name: string };
}

export interface ProductListParams extends PaginationParams {
  categoryId?: string;
  isActive?: string;
}

export interface StockFilter {
  warehouseId?: string;
  productId?: string;
  lowStock?: boolean;
}

export interface MovementListParams extends PaginationParams {
  productId?: string;
  warehouseId?: string;
  movementType?: string;
  fromDate?: string;
  toDate?: string;
}

// ─── Categories ─────────────────────────────────────────────────────

export async function listCategories(params: PaginationParams): Promise<{ data: InventoryCategory[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<InventoryCategory[]>>("/inventory/categories", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getCategory(id: string): Promise<InventoryCategory> {
  const response = await api.get<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`);
  return response.data.data;
}

export async function createCategory(data: CreateCategoryPayload): Promise<InventoryCategory> {
  const response = await api.post<ApiResponse<InventoryCategory>>("/inventory/categories", data);
  return response.data.data;
}

export async function updateCategory(id: string, data: UpdateCategoryPayload): Promise<InventoryCategory> {
  const response = await api.patch<ApiResponse<InventoryCategory>>(`/inventory/categories/${id}`, data);
  return response.data.data;
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/inventory/categories/${id}`);
}

// ─── Products ───────────────────────────────────────────────────────

export async function listProducts(params: ProductListParams): Promise<{ data: Product[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Product[]>>("/inventory/products", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getProduct(id: string): Promise<Product> {
  const response = await api.get<ApiResponse<Product>>(`/inventory/products/${id}`);
  return response.data.data;
}

export async function createProduct(data: CreateProductPayload): Promise<Product> {
  const response = await api.post<ApiResponse<Product>>("/inventory/products", data);
  return response.data.data;
}

export async function updateProduct(id: string, data: UpdateProductPayload): Promise<Product> {
  const response = await api.patch<ApiResponse<Product>>(`/inventory/products/${id}`, data);
  return response.data.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/inventory/products/${id}`);
}

// ─── Variants ───────────────────────────────────────────────────────

export async function listVariants(productId: string): Promise<ProductVariant[]> {
  const response = await api.get<ApiResponse<ProductVariant[]>>(`/inventory/products/${productId}/variants`);
  return response.data.data;
}

export async function createVariant(productId: string, data: CreateVariantPayload): Promise<ProductVariant> {
  const response = await api.post<ApiResponse<ProductVariant>>(`/inventory/products/${productId}/variants`, data);
  return response.data.data;
}

export async function updateVariant(productId: string, variantId: string, data: UpdateVariantPayload): Promise<ProductVariant> {
  const response = await api.patch<ApiResponse<ProductVariant>>(`/inventory/products/${productId}/variants/${variantId}`, data);
  return response.data.data;
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await api.delete(`/inventory/products/${productId}/variants/${variantId}`);
}

// ─── Warehouses ─────────────────────────────────────────────────────

export async function listWarehouses(params: PaginationParams): Promise<{ data: Warehouse[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<Warehouse[]>>("/inventory/warehouses", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getWarehouse(id: string): Promise<Warehouse> {
  const response = await api.get<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`);
  return response.data.data;
}

export async function createWarehouse(data: CreateWarehousePayload): Promise<Warehouse> {
  const response = await api.post<ApiResponse<Warehouse>>("/inventory/warehouses", data);
  return response.data.data;
}

export async function updateWarehouse(id: string, data: UpdateWarehousePayload): Promise<Warehouse> {
  const response = await api.patch<ApiResponse<Warehouse>>(`/inventory/warehouses/${id}`, data);
  return response.data.data;
}

export async function deleteWarehouse(id: string): Promise<void> {
  await api.delete(`/inventory/warehouses/${id}`);
}

// ─── Stock ──────────────────────────────────────────────────────────

export async function getStock(filters?: StockFilter): Promise<StockItem[]> {
  const response = await api.get<ApiResponse<StockItem[]>>("/inventory/stock", { params: filters });
  return response.data.data;
}

export async function transferStock(data: TransferStockPayload): Promise<void> {
  await api.post("/inventory/stock/transfer", data);
}

export async function adjustStock(data: AdjustStockPayload): Promise<void> {
  await api.post("/inventory/stock/adjust", data);
}

// ─── Movements ──────────────────────────────────────────────────────

export async function listMovements(params: MovementListParams): Promise<{ data: StockMovement[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<StockMovement[]>>("/inventory/movements", { params });
  return { data: response.data.data, meta: response.data.meta! };
}
