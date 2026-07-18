"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { createRole, updateRole, getRole, listPermissions } from "@/modules/roles/roles.api";
import { CACHE_KEYS } from "@/lib/constants";
import type { Permission } from "@/types/role";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100).trim(),
  description: z.string().max(500).optional().or(z.literal("")),
  permissionIds: z.array(z.string()).optional(),
});

type RoleFormData = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId?: string;
}

export function RoleFormModal({ open, onOpenChange, roleId }: RoleFormModalProps) {
  const isEdit = !!roleId;
  const queryClient = useQueryClient();

  const { data: permissions, isLoading: loadingPerms } = useQuery({
    queryKey: CACHE_KEYS.PERMISSIONS,
    queryFn: listPermissions,
    enabled: open,
  });

  const { data: existingRole, isLoading: loadingRole } = useQuery({
    queryKey: CACHE_KEYS.ROLE(roleId!),
    queryFn: () => getRole(roleId!),
    enabled: isEdit && open,
  });

  const form = useForm<RoleFormData>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", description: "", permissionIds: [] },
  });

  useEffect(() => {
    if (isEdit && existingRole) {
      form.reset({
        name: existingRole.name,
        description: existingRole.description || "",
        permissionIds: existingRole.permissions.map((p) => p.id),
      });
    }
  }, [isEdit, existingRole, form]);

  useEffect(() => {
    if (!open) {
      form.reset({ name: "", description: "", permissionIds: [] });
    }
  }, [open, form]);

  const createMutation = useMutation({
    mutationFn: (data: RoleFormData) =>
      createRole({
        name: data.name,
        description: data.description || undefined,
        permissionIds: data.permissionIds?.length ? data.permissionIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ROLES });
      toast({ title: "Role created successfully", variant: "success" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to create role", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RoleFormData) =>
      updateRole(roleId!, {
        name: data.name,
        description: data.description || undefined,
        permissionIds: data.permissionIds?.length ? data.permissionIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.ROLES });
      toast({ title: "Role updated successfully", variant: "success" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const selectedIds = form.watch("permissionIds") || [];

  const togglePermission = (permId: string) => {
    const updated = selectedIds.includes(permId)
      ? selectedIds.filter((id) => id !== permId)
      : [...selectedIds, permId];
    form.setValue("permissionIds", updated, { shouldDirty: true });
  };

  const grouped = (permissions || []).reduce<Record<string, Permission[]>>((acc, p) => {
    const cat = p.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  if (loadingRole) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
          </DialogHeader>
          <LoadingSpinner />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Role" : "Add Role"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update role details and permissions" : "Create a new role with permissions"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((data) => {
          if (isEdit) {
            updateMutation.mutate(data);
          } else {
            createMutation.mutate(data);
          }
        })} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Role Name</Label>
            <Input id="name" placeholder="e.g. Inventory Manager" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" placeholder="Describe this role" {...form.register("description")} />
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            {loadingPerms ? (
              <LoadingSpinner />
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground">No permissions available</p>
            ) : (
              <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-3">
                {Object.entries(grouped).map(([category, perms]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">{category}</p>
                    <div className="grid grid-cols-2 gap-1">
                      {perms.map((perm) => (
                        <label
                          key={perm.id}
                          className="flex items-center gap-2 text-sm py-1 cursor-pointer hover:bg-accent rounded px-1"
                        >
                          <Checkbox
                            checked={selectedIds.includes(perm.id)}
                            onCheckedChange={() => togglePermission(perm.id)}
                          />
                          <span>{perm.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Update Role" : "Create Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
