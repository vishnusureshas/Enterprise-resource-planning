import api from "@/lib/api";
import type {
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ChangePasswordPayload,
  UpdateProfilePayload,
  MfaSetupResponse,
  User,
} from "@/types/auth";
import type { ApiResponse } from "@/types/api";

export async function loginUser(data: LoginPayload): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>("/auth/login", data);
  return response.data.data;
}

export async function registerUser(data: RegisterPayload): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>("/auth/register", data);
  return response.data.data;
}

export async function logoutUser(): Promise<void> {
  await api.post("/auth/logout");
}

export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const response = await api.post<ApiResponse<LoginResponse>>("/auth/refresh", { refreshToken });
  return response.data.data;
}

export async function forgotPassword(data: ForgotPasswordPayload): Promise<{ resetUrl?: string }> {
  const response = await api.post<ApiResponse<{ resetUrl?: string }>>("/auth/forgot-password", data);
  return response.data.data ?? {};
}

export async function resetPassword(data: ResetPasswordPayload): Promise<void> {
  await api.post("/auth/reset-password", data);
}

export async function changePassword(data: ChangePasswordPayload): Promise<void> {
  await api.post("/auth/change-password", data);
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<ApiResponse<User>>("/auth/me");
  return response.data.data;
}

export async function updateProfile(data: UpdateProfilePayload): Promise<User> {
  const response = await api.patch<ApiResponse<User>>("/auth/me", data);
  return response.data.data;
}

export async function setupMfa(): Promise<MfaSetupResponse> {
  const response = await api.post<ApiResponse<MfaSetupResponse>>("/auth/mfa/setup");
  return response.data.data;
}

export async function verifyMfa(token: string): Promise<void> {
  await api.post("/auth/mfa/verify", { token });
}

export async function disableMfa(password: string): Promise<{ user?: User }> {
  const response = await api.post<ApiResponse<{ user?: User }>>("/auth/mfa/disable", { password });
  return response.data.data ?? {};
}
