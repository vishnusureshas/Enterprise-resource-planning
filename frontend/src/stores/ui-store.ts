import { create } from "zustand";

interface UiState {
  sidebarCollapsed: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  theme: "light",
  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      const stored = JSON.parse(localStorage.getItem("erp-ui") || "{}");
      stored.state = stored.state || {};
      stored.state.theme = theme;
      localStorage.setItem("erp-ui", JSON.stringify(stored));
    } catch {}
  },
}));
