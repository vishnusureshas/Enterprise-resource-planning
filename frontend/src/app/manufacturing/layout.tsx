"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutList, ClipboardList, Wrench, Factory } from "lucide-react";

const TABS = [
  { label: "Overview", path: "/manufacturing", icon: Factory },
  { label: "Work Orders", path: "/manufacturing/work-orders", icon: ClipboardList },
  { label: "BOM", path: "/manufacturing/bom", icon: LayoutList },
  { label: "Work Centers", path: "/manufacturing/work-centers", icon: Wrench },
];

export default function ManufacturingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const isActive = tab.path === "/manufacturing"
              ? pathname === "/manufacturing"
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
