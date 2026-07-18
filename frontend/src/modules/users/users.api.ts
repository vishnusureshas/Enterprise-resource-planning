import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";
import type { UserListItem } from "@/types/user";
import type { Role } from "@/types/role";

export interface UserDetails extends UserListItem {
  avatarUrl?: string;
  mfaEnabled: boolean;
  permissions: string[];
  organizationId: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleIds?: string[];
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  status?: "active" | "inactive" | "suspended";
  roleIds?: string[];
}

export interface UserListParams extends PaginationParams {
  status?: string;
  role?: string;
}

export async function listUsers(params: UserListParams): Promise<{ data: UserListItem[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<UserListItem[]>>("/users", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getUser(id: string): Promise<UserDetails> {
  const response = await api.get<ApiResponse<UserDetails>>(`/users/${id}`);
  return response.data.data;
}

export async function createUser(data: CreateUserPayload): Promise<UserDetails> {
  const response = await api.post<ApiResponse<UserDetails>>("/users", data);
  return response.data.data;
}

export async function updateUser(id: string, data: UpdateUserPayload): Promise<UserDetails> {
  const response = await api.patch<ApiResponse<UserDetails>>(`/users/${id}`, data);
  return response.data.data;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/users/${id}`);
}
