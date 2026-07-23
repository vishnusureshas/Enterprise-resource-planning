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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { createUser, updateUser, getUser } from "@/modules/users/users.api";
import { listRoles } from "@/modules/roles/roles.api";
import { CACHE_KEYS } from "@/lib/constants";
import { X } from "lucide-react";

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255).trim(),
  lastName: z.string().min(1, "Last name is required").max(255).trim(),
  email: z.string().email("Invalid email").toLowerCase().trim(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  phone: z.string().optional().or(z.literal("")),
  roleIds: z.array(z.string()).optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(255).trim(),
  lastName: z.string().min(1, "Last name is required").max(255).trim(),
  phone: z.string().optional().or(z.literal("")),
  status: z.enum(["active", "inactive", "pending", "suspended"]),
  roleIds: z.array(z.string()).optional(),
});

type CreateFormData = z.infer<typeof createUserSchema>;
type UpdateFormData = z.infer<typeof updateUserSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function UserFormModal({ open, onOpenChange, userId }: UserFormModalProps) {
  const isEdit = !!userId;
  const queryClient = useQueryClient();

  const { data: roles } = useQuery({
    queryKey: CACHE_KEYS.ROLES,
    queryFn: listRoles,
    enabled: open,
  });

  const { data: existingUser, isLoading: loadingUser } = useQuery({
    queryKey: CACHE_KEYS.USER(userId!),
    queryFn: () => getUser(userId!),
    enabled: isEdit && open,
  });

  const createForm = useForm<CreateFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", phone: "", roleIds: [] },
  });

  const updateForm = useForm<UpdateFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { firstName: "", lastName: "", phone: "", status: "active", roleIds: [] },
  });

  useEffect(() => {
    if (isEdit && existingUser && roles) {
      const roleIds = existingUser.roles
        .map((roleName) => roles.find((r) => r.name === roleName)?.id)
        .filter(Boolean);
      updateForm.reset({
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        phone: existingUser.phone || "",
        status: existingUser.status as UpdateFormData["status"],
        roleIds,
      });
    }
  }, [isEdit, existingUser, roles, updateForm]);

  useEffect(() => {
    if (!open) {
      createForm.reset();
      updateForm.reset();
    }
  }, [open, createForm, updateForm]);

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) =>
      createUser({
        ...data,
        phone: data.phone || undefined,
        roleIds: data.roleIds?.length ? data.roleIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USERS });
      toast({ title: "User created successfully", variant: "success" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to create user", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateFormData) =>
      updateUser(userId!, {
        ...data,
        phone: data.phone || null,
        roleIds: data.roleIds?.length ? data.roleIds : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.USER(userId!) });
      toast({ title: "User updated successfully", variant: "success" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update user", variant: "destructive" });
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEdit && loadingUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <LoadingSpinner />
        </DialogContent>
      </Dialog>
    );
  }

  const roleIds = (isEdit ? updateForm.watch("roleIds") : createForm.watch("roleIds")) || [];

  const handleRoleToggle = (roleId: string) => {
    const current = roleIds;
    const updated = current.includes(roleId)
      ? current.filter((r) => r !== roleId)
      : [...current, roleId];
    if (isEdit) {
      updateForm.setValue("roleIds", updated, { shouldDirty: true });
    } else {
      createForm.setValue("roleIds", updated, { shouldDirty: true });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update user details and roles" : "Create a new organization user"}
          </DialogDescription>
        </DialogHeader>

        {isEdit ? (
          <form onSubmit={updateForm.handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" {...updateForm.register("firstName")} />
                {updateForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{updateForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" {...updateForm.register("lastName")} />
                {updateForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{updateForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={existingUser?.email || ""} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+1234567890" {...updateForm.register("phone")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateForm.watch("status") || "active"}
                onValueChange={(v) => updateForm.setValue("status", v as "active" | "inactive" | "suspended")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                {roles?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No roles available</p>
                )}
                {roles?.map((role) => (
                  <Button
                    key={role.id}
                    type="button"
                    variant={roleIds.includes(role.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    {role.name}
                    {roleIds.includes(role.id) && <X className="ml-1 h-3 w-3" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Update User"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" placeholder="John" {...createForm.register("firstName")} />
                {createForm.formState.errors.firstName && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" placeholder="Doe" {...createForm.register("lastName")} />
                {createForm.formState.errors.lastName && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" {...createForm.register("email")} />
              {createForm.formState.errors.email && (
                <p className="text-sm text-destructive">{createForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...createForm.register("password")} />
              {createForm.formState.errors.password && (
                <p className="text-sm text-destructive">{createForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input id="phone" type="tel" placeholder="+1234567890" {...createForm.register("phone")} />
            </div>

            <div className="space-y-2">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-2 border rounded-md p-3 max-h-32 overflow-y-auto">
                {roles?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No roles available</p>
                )}
                {roles?.map((role) => (
                  <Button
                    key={role.id}
                    type="button"
                    variant={roleIds.includes(role.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleRoleToggle(role.id)}
                  >
                    {role.name}
                    {roleIds.includes(role.id) && <X className="ml-1 h-3 w-3" />}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Create User"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
