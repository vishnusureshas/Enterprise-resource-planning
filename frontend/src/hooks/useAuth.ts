"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES, CACHE_KEYS } from "@/lib/constants";
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
} from "@/modules/auth/auth.api";
import type { LoginPayload, RegisterPayload } from "@/types/auth";

export function useAuth() {
  const router = useRouter();
  const store = useAuthStore();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (data: LoginPayload) => {
    setLoading(true);
    try {
      const result = await loginUser(data);
      store.setAuth(result.user, result.accessToken, result.refreshToken);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD_STATS });
      return { success: true };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setLoading(false);
      return {
        success: false,
        error: error?.response?.data?.error?.message || "Login failed",
      };
    }
  }, [store, queryClient]);

  const register = useCallback(async (data: RegisterPayload) => {
    setLoading(true);
    try {
      const result = await registerUser(data);
      store.setAuth(result.user, result.accessToken, result.refreshToken);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD_STATS });
      return { success: true };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { message?: string } } } };
      setLoading(false);
      return {
        success: false,
        error: error?.response?.data?.error?.message || "Registration failed",
      };
    }
  }, [store, queryClient]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    }
    queryClient.clear();
    store.logout();
    router.push(ROUTES.LOGIN);
  }, [router, store, queryClient]);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      store.setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD_STATS });
    },
    onError: () => setLoading(false),
    onMutate: () => setLoading(true),
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      store.setAuth(data.user, data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.DASHBOARD_STATS });
    },
    onError: () => setLoading(false),
    onMutate: () => setLoading(true),
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSettled: () => {
      queryClient.clear();
      store.logout();
      router.push(ROUTES.LOGIN);
    },
  });

  const currentUserQuery = useQuery({
    queryKey: CACHE_KEYS.CURRENT_USER,
    queryFn: getCurrentUser,
    enabled: store.isAuthenticated && !!store.accessToken,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: loading,
    login,
    register,
    logout,
    setUser: store.setUser,
    loginMutation,
    registerMutation,
    logoutMutation,
    currentUserQuery,
  };
}
