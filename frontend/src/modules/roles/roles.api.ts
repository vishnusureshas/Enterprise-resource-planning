import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { Permission } from "@/types/role";

export interface RoleDetails {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export async function listRoles(): Promise<RoleDetails[]> {
  const response = await api.get<ApiResponse<RoleDetails[]>>("/roles");
  return response.data.data;
}

export async function getRole(id: string): Promise<RoleDetails> {
  const response = await api.get<ApiResponse<RoleDetails>>(`/roles/${id}`);
  return response.data.data;
}

export async function createRole(data: CreateRolePayload): Promise<RoleDetails> {
  const response = await api.post<ApiResponse<RoleDetails>>("/roles", data);
  return response.data.data;
}

export async function updateRole(id: string, data: UpdateRolePayload): Promise<RoleDetails> {
  const response = await api.patch<ApiResponse<RoleDetails>>(`/roles/${id}`, data);
  return response.data.data;
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${id}`);
}

export async function listPermissions(): Promise<Permission[]> {
  const response = await api.get<ApiResponse<Permission[]>>("/roles/permissions");
  return response.data.data;
}
