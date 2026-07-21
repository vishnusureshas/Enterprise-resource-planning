"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import { listRoles, deleteRole } from "@/modules/roles/roles.api";
import { RoleFormModal } from "@/modules/roles/components/role-form-modal";
import { CACHE_KEYS } from "@/lib/constants";
import { Plus, Shield as ShieldIcon, Pencil, Trash2 } from "lucide-react";
import type { RoleDetails } from "@/modules/roles/roles.api";
import type { ColumnDef } from "@tanstack/react-table";

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);

  const { data: roles, isLoading, isError } = useQuery({
    queryKey: CACHE_KEYS.ROLES,
    queryFn: listRoles,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ROLES });
      toast({ title: "Role deleted successfully", variant: "success" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete role", variant: "destructive" });
    },
  });

  const columns: ColumnDef<RoleDetails>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.original.description || "—",
    },
    {
      accessorKey: "permissions",
      header: "Permissions",
      cell: ({ row }) => (
        <div className="flex gap-1 flex-wrap">
          {row.original.permissions?.slice(0, 4).map((p) => (
            <Badge key={p.name} variant="outline" className="text-xs">{p.name}</Badge>
          ))}
          {row.original.permissions?.length > 4 && (
            <Badge variant="outline" className="text-xs">+{row.original.permissions.length - 4}</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => { setEditRoleId(row.original.id); setShowModal(true); }}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteId(row.original.id)}
            disabled={row.original.name === "admin"}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Roles</h2>
          <p className="text-muted-foreground">Manage roles and permissions</p>
        </div>
        <Button onClick={() => { setEditRoleId(undefined); setShowModal(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Role
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : isError ? (
            <EmptyState icon={<ShieldIcon className="h-12 w-12" />} title="Failed to load roles" description="Try refreshing the page" />
          ) : roles && roles.length > 0 ? (
            <DataTable columns={columns} data={roles} />
          ) : (
            <EmptyState icon={<ShieldIcon className="h-12 w-12" />} title="No roles found" description="Create a role to get started" />
          )}
        </CardContent>
      </Card>

      <RoleFormModal
        open={showModal}
        onOpenChange={(o) => { setShowModal(o); if (!o) setEditRoleId(undefined); }}
        roleId={editRoleId}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Role"
        description="Are you sure you want to delete this role? Users assigned this role will lose its permissions."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
