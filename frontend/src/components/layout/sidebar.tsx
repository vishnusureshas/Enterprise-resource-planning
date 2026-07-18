"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { useUiStore } from "@/stores/ui-store";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  Building2,
  Landmark,
  Factory,
  TrendingUp,
  UserCircle,
  BarChart3,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", path: "/inventory", icon: Package, roles: ["admin", "inventory_clerk", "manager"] },
  { label: "Sales Orders", path: "/orders", icon: ShoppingCart, roles: ["admin", "sales_rep", "manager"] },
  { label: "Purchases", path: "/procurement", icon: Truck, roles: ["admin", "procurement", "manager"] },
  { label: "Customers", path: "/customers", icon: Users, roles: ["admin", "sales_rep", "crm"] },
  { label: "Vendors", path: "/vendors", icon: Building2, roles: ["admin", "procurement", "finance"] },
  { label: "Finance", path: "/finance", icon: Landmark, roles: ["admin", "finance"] },
  { label: "Manufacturing", path: "/manufacturing", icon: Factory, roles: ["admin", "production"] },
  { label: "CRM", path: "/crm", icon: TrendingUp, roles: ["admin", "sales_rep", "crm"] },
  { label: "HR", path: "/hr", icon: UserCircle, roles: ["admin", "hr"] },
  { label: "Reports", path: "/reports", icon: BarChart3, roles: ["admin", "manager", "finance"] },
  { label: "Users & Roles", path: "/users", icon: Users, roles: ["admin"] },
  { label: "Audit Logs", path: "/audit", icon: ScrollText, roles: ["admin", "compliance"] },
  { label: "Settings", path: "/settings", icon: Settings, roles: ["admin"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return user?.roles?.some((r) => item.roles?.includes(r));
  });

  return (
    <aside
      className={cn(
        "flex flex-col border-r bg-card transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60",
      )}
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!sidebarCollapsed && (
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            ERP
          </Link>
        )}
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="shrink-0">
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                sidebarCollapsed && "justify-center px-2",
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
