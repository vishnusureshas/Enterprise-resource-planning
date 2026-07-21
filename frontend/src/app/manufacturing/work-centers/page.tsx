"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  listWorkCenters, deleteWorkCenter,
  type WorkCenter,
} from "@/modules/manufacturing/manufacturing.api";
import { WorkCenterFormModal } from "@/modules/manufacturing/components/work-center-form-modal";
import { CACHE_KEYS } from "@/lib/constants";
import { Plus, Search, Wrench, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export default function WorkCentersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.WORK_CENTERS, { page, limit: 20, search }],
    queryFn: () => listWorkCenters({ page, limit: 20, search }),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkCenter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.WORK_CENTERS });
      toast({ title: "Work center deleted", variant: "success" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete work center", variant: "destructive" }),
  });

  const columns: ColumnDef<WorkCenter>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "capacity_per_shift",
      header: "Capacity/Shift",
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "success" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditId(row.original.id); setShowModal(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteId(row.original.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Work Centers</h2>
          <p className="text-muted-foreground text-sm">Manage production work centers</p>
        </div>
        <Button onClick={() => { setEditId(undefined); setShowModal(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Work Center
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<Wrench className="h-12 w-12" />} title="Failed to load work centers" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<Wrench className="h-12 w-12" />} title="No work centers found" description="Add a work center to get started" />
          )}
        </CardContent>
      </Card>

      <WorkCenterFormModal
        open={showModal}
        onOpenChange={(o) => { setShowModal(o); if (!o) setEditId(undefined); }}
        centerId={editId}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Work Center"
        description="Are you sure you want to delete this work center?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
