"use client";

import { useAuthStore } from "@/stores/auth-store";

interface PermissionGateProps {
  children: React.ReactNode;
  roles?: string[];
  permissions?: string[];
  fallback?: React.ReactNode;
}

export function PermissionGate({ children, roles, permissions, fallback = null }: PermissionGateProps) {
  const { user } = useAuthStore();

  if (!user) return null;

  if (roles && !roles.some((r) => user.roles.includes(r))) {
    return fallback;
  }

  if (permissions && !permissions.some((p) => user.permissions.includes(p))) {
    return fallback;
  }

  return <>{children}</>;
}
