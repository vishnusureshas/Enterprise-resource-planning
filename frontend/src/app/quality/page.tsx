"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { listInspections, listChecklists } from "@/modules/quality/quality.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ShieldCheck, ClipboardCheck, ClipboardList, AlertCircle } from "lucide-react";

export default function QualityOverviewPage() {
  const router = useRouter();

  const { data: inspData, isLoading: loadingInsp } = useQuery({
    queryKey: [...CACHE_KEYS.QC_INSPECTIONS, { limit: 5 }],
    queryFn: () => listInspections({ limit: 5 }),
  });

  const { data: clData } = useQuery({
    queryKey: [...CACHE_KEYS.QC_CHECKLISTS, { limit: 100 }],
    queryFn: () => listChecklists({ limit: 100 }),
  });

  const inspections = inspData?.data || [];
  const statusCounts: Record<string, number> = {};
  inspections.forEach((i) => { statusCounts[i.status] = (statusCounts[i.status] || 0) + 1; });

  const statsCards = [
    {
      title: "Total Inspections",
      value: inspData?.meta.total ?? 0,
      icon: ClipboardCheck,
      color: "text-blue-600",
      onClick: () => router.push(ROUTES.QUALITY_INSPECTIONS),
    },
    {
      title: "Pending",
      value: statusCounts["pending"] || 0,
      icon: AlertCircle,
      color: "text-amber-600",
      onClick: () => router.push(ROUTES.QUALITY_INSPECTIONS),
    },
    {
      title: "Passed",
      value: statusCounts["passed"] || 0,
      icon: ShieldCheck,
      color: "text-green-600",
      onClick: () => router.push(ROUTES.QUALITY_INSPECTIONS),
    },
    {
      title: "Checklists",
      value: clData?.meta.total ?? 0,
      icon: ClipboardList,
      color: "text-purple-600",
      onClick: () => router.push(ROUTES.QUALITY_CHECKLISTS),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quality Control</h2>
        <p className="text-muted-foreground text-sm">Manage inspections, checklists, and quality criteria</p>
      </div>

      {loadingInsp ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((card) => (
              <Card key={card.title} className="cursor-pointer hover:shadow-md transition-shadow" onClick={card.onClick}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Recent Inspections</CardTitle>
                <span
                  className="text-sm text-primary cursor-pointer hover:underline"
                  onClick={() => router.push(ROUTES.QUALITY_INSPECTIONS)}
                >
                  View all
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {inspections.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <ShieldCheck className="h-8 w-8" />
                  <p className="text-sm">No inspections yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {inspections.map((insp) => (
                    <div
                      key={insp.id}
                      className="flex items-center justify-between rounded-lg border p-3 cursor-pointer hover:bg-accent"
                      onClick={() => router.push(ROUTES.QUALITY_INSPECTION_DETAIL(insp.id))}
                    >
                      <div>
                        <p className="text-sm font-medium">{insp.inspection_number}</p>
                        <p className="text-xs text-muted-foreground">{insp.reference_type.replace(/_/g, " ")}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium capitalize">{insp.status.replace("_", " ")}</p>
                        <p className="text-xs text-muted-foreground">{insp.result_summary || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
