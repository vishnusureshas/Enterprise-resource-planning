"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Truck, Package, Building2 } from "lucide-react";

const TABS = [
  { label: "Overview", path: "/shipping", icon: Truck },
  { label: "Shipments", path: "/shipping/shipments", icon: Package },
  { label: "Carriers", path: "/shipping/carriers", icon: Building2 },
];

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const isActive = tab.path === "/shipping"
              ? pathname === "/shipping"
              : pathname.startsWith(tab.path);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.path}
                href={tab.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}
