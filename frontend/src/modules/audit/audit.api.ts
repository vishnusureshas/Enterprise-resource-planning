import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PaginationParams } from "@/types/api";

export interface AuditLogEntry {
  id: string;
  auditableType: string;
  auditableId: string;
  action: string;
  userId: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  changes: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  createdAt: string;
}

export interface AuditLogParams extends PaginationParams {
  action?: string;
  auditableType?: string;
  userId?: string;
  from?: string;
  to?: string;
}

export async function listAuditLogs(params: AuditLogParams): Promise<{ data: AuditLogEntry[]; meta: PaginationMeta }> {
  const response = await api.get<ApiResponse<AuditLogEntry[]>>("/audit-logs", { params });
  return { data: response.data.data, meta: response.data.meta! };
}

export async function getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
  const response = await api.get<ApiResponse<AuditLogEntry[]>>(`/audit-logs/${entityType}/${entityId}`);
  return response.data.data;
}

export async function getAuditLogsByUser(userId: string, params?: { limit?: number; offset?: number }): Promise<{ data: AuditLogEntry[]; total: number }> {
  const response = await api.get<ApiResponse<AuditLogEntry[]>>(`/audit-logs/user/${userId}`, { params });
  return { data: response.data.data, total: response.data.meta?.total ?? 0 };
}

export async function exportAuditLogs(params?: { from?: string; to?: string; action?: string; auditableType?: string }): Promise<AuditLogEntry[]> {
  const response = await api.get<ApiResponse<AuditLogEntry[]>>("/audit-logs/export", { params });
  return response.data.data;
}
