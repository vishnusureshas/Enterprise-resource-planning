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
import { FormModal } from "@/components/shared/form-modal";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import {
  listCarriers, createCarrier, updateCarrier, deleteCarrier,
  type Carrier, type CreateCarrierPayload,
} from "@/modules/shipping/shipping.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Building2, Search, Plus, Pencil, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

export default function CarriersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCarrierPayload>({ code: "", name: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.SHIPPING_CARRIERS, { page, limit: 20, search }],
    queryFn: () => listCarriers({ page, limit: 20, search }),
    placeholderData: keepPreviousData,
  });

  const createMutation = useMutation({
    mutationFn: (d: CreateCarrierPayload) => editId ? updateCarrier(editId, d) : createCarrier(d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_CARRIERS });
      toast({ title: editId ? "Carrier updated" : "Carrier created", variant: "success" });
      setModalOpen(false); setEditId(null); setForm({ code: "", name: "" });
    },
    onError: () => toast({ title: "Failed to save carrier", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCarrier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.SHIPPING_CARRIERS });
      toast({ title: "Carrier deleted", variant: "success" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Failed to delete carrier", variant: "destructive" }),
  });

  const openEdit = (carrier: Carrier) => {
    setEditId(carrier.id);
    setForm({ code: carrier.code, name: carrier.name, description: carrier.description,
      website: carrier.website, phone: carrier.phone, email: carrier.email,
      trackingUrlTemplate: carrier.tracking_url_template, status: carrier.status });
    setModalOpen(true);
  };

  const columns: ColumnDef<Carrier>[] = [
    { accessorKey: "code", header: "Code" },
    { accessorKey: "name", header: "Name" },
    { accessorKey: "email", header: "Email", cell: ({ row }) => row.original.email || "—" },
    { accessorKey: "phone", header: "Phone", cell: ({ row }) => row.original.phone || "—" },
    {
      accessorKey: "status", header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "active" ? "success" : "secondary"}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(row.original)}>
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
          <h2 className="text-2xl font-bold tracking-tight">Carriers</h2>
          <p className="text-muted-foreground text-sm">Manage shipping carriers</p>
        </div>
        <Button onClick={() => { setEditId(null); setForm({ code: "", name: "" }); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Carrier
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search carriers..." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <LoadingSpinner />
            : isError ? <EmptyState icon={<Building2 className="h-12 w-12" />} title="Failed to load carriers" />
            : data && data.data.length > 0 ? (
              <DataTable columns={columns} data={data.data} total={data.meta.total}
                pageIndex={page - 1} onPageChange={(p) => setPage(p + 1)} />
            ) : (
              <EmptyState icon={<Building2 className="h-12 w-12" />} title="No carriers" description="Add a shipping carrier" />
            )}
        </CardContent>
      </Card>

      <FormModal open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setEditId(null); }}
        title={editId ? "Edit Carrier" : "Add Carrier"}
        onSubmit={() => createMutation.mutate(form)}
        isSubmitting={createMutation.isPending}>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Code *</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="FEDEX" />
            </div>
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="FedEx" />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Website</Label>
              <Input value={form.website || ""} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="carrier@example.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Tracking URL Template</Label>
              <Input value={form.trackingUrlTemplate || ""} onChange={(e) => setForm({ ...form, trackingUrlTemplate: e.target.value })} placeholder="https://carrier.com/track/{tracking_number}" />
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete Carrier" description="Are you sure?" variant="destructive"
        onConfirm={() => deleteMutation.mutate(deleteId!)} isLoading={deleteMutation.isPending} />
    </div>
  );
}
