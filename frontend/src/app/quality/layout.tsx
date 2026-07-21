"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldCheck, ClipboardCheck, ClipboardList, Ruler } from "lucide-react";

const TABS = [
  { label: "Overview", path: "/quality", icon: ShieldCheck },
  { label: "Inspections", path: "/quality/inspections", icon: ClipboardCheck },
  { label: "Checklists", path: "/quality/checklists", icon: ClipboardList },
  { label: "Criteria", path: "/quality/criteria", icon: Ruler },
];

export default function QualityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="border-b">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => {
            const isActive = tab.path === "/quality"
              ? pathname === "/quality"
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
