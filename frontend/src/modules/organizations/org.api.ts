import api from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  website?: string;
  phone?: string;
  address?: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSettings {
  host: string | null;
  port: number;
  secure: boolean;
  user: string | null;
  pass: string | null;
  fromName: string | null;
  fromEmail: string | null;
}

export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  passwordRequireNumber: boolean;
  passwordRequireUpper: boolean;
  sessionTimeoutMinutes: number;
  mfaRequired: boolean;
  maxLoginAttempts: number;
  ipWhitelist: string[];
}

export interface NotificationSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  weeklyDigest: boolean;
  orderConfirmation: boolean;
  passwordChangeAlert: boolean;
  loginAlert: boolean;
}

export interface NumberFormatSettings {
  decimalSeparator: "." | ",";
  thousandsSeparator: "," | "." | " " | "";
  decimalPlaces: number;
}

export interface LocalizationSettings {
  defaultLanguage: string;
  dateFormat: string;
  timezone: string;
  currency: string;
  weekStartsOn: number;
  numberFormat: NumberFormatSettings;
}

export interface OrgSettings {
  email: EmailSettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  localization: LocalizationSettings;
}

export interface OrgStats {
  user_count: number;
  role_count: number;
}

export async function getOrganization(): Promise<Organization> {
  const response = await api.get<ApiResponse<Organization>>("/organizations");
  return response.data.data;
}

export async function updateOrganization(data: Partial<Organization>): Promise<Organization> {
  const response = await api.patch<ApiResponse<Organization>>("/organizations", data);
  return response.data.data;
}

export async function getOrgSettings(): Promise<OrgSettings> {
  const response = await api.get<ApiResponse<OrgSettings>>("/organizations/settings");
  return response.data.data;
}

export async function updateOrgSettings(data: Partial<OrgSettings>): Promise<OrgSettings> {
  const response = await api.patch<ApiResponse<OrgSettings>>("/organizations/settings", data);
  return response.data.data;
}

export async function getOrgStats(): Promise<OrgStats> {
  const response = await api.get<ApiResponse<OrgStats>>("/organizations/stats");
  return response.data.data;
}
