"use client";

import { useAuthStore } from "@/stores/auth-store";

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (...perms: string[]): boolean => {
    return perms.some((p) => permissions.includes(p));
  };

  const hasAllPermissions = (...perms: string[]): boolean => {
    return perms.every((p) => permissions.includes(p));
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (...roleList: string[]): boolean => {
    return roleList.some((r) => roles.includes(r));
  };

  const isAdmin = (): boolean => {
    return roles.includes("admin");
  };

  return {
    permissions,
    roles,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
}
