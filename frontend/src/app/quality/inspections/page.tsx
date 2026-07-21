"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import {
  listInspections, getInspectionStatusLabel, getInspectionStatusColor, getReferenceLabel,
  type Inspection,
} from "@/modules/quality/quality.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { Plus, Search, ClipboardCheck, Eye } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

const STATUSES = ["", "pending", "in_progress", "passed", "failed", "blocked"];
const REF_TYPES = ["", "purchase_order_item", "work_order_output", "sales_order_item"];

export default function InspectionsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [refFilter, setRefFilter] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.QC_INSPECTIONS, { page, limit: 20, search, status: statusFilter || undefined, referenceType: refFilter || undefined }],
    queryFn: () => listInspections({ page, limit: 20, search, status: statusFilter || undefined, referenceType: refFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<Inspection>[] = [
    {
      accessorKey: "inspection_number",
      header: "Inspection #",
      cell: ({ row }) => (
        <button
          className="font-medium text-primary hover:underline text-left"
          onClick={() => router.push(ROUTES.QUALITY_INSPECTION_DETAIL(row.original.id))}
        >
          {row.original.inspection_number}
        </button>
      ),
    },
    {
      accessorKey: "reference_type",
      header: "Source",
      cell: ({ row }) => getReferenceLabel(row.original.reference_type),
    },
    {
      accessorKey: "checklist",
      header: "Checklist",
      cell: ({ row }) => row.original.checklist?.name || "—",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={getInspectionStatusColor(row.original.status)}>
          {getInspectionStatusLabel(row.original.status)}
        </Badge>
      ),
    },
    {
      accessorKey: "result_summary",
      header: "Result",
      cell: ({ row }) => row.original.result_summary ? (
        <Badge variant={row.original.result_summary === "pass" ? "success" : row.original.result_summary === "fail" ? "destructive" : "warning"}>
          {row.original.result_summary.replace("_", " ")}
        </Badge>
      ) : "—",
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.QUALITY_INSPECTION_DETAIL(row.original.id))}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inspections</h2>
          <p className="text-muted-foreground text-sm">Quality inspections for purchases, manufacturing, and sales</p>
        </div>
        <Button onClick={() => router.push(ROUTES.QUALITY_INSPECTION_NEW)}>
          <Plus className="mr-2 h-4 w-4" /> New Inspection
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by inspection number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">All statuses</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>{getInspectionStatusLabel(s)}</option>
              ))}
            </select>
            <select
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={refFilter}
              onChange={(e) => { setRefFilter(e.target.value); setPage(1); }}
            >
              <option value="">All sources</option>
              {REF_TYPES.filter(Boolean).map((rt) => (
                <option key={rt} value={rt}>{getReferenceLabel(rt)}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<ClipboardCheck className="h-12 w-12" />} title="Failed to load inspections" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<ClipboardCheck className="h-12 w-12" />} title="No inspections found" description="Create an inspection to get started" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
