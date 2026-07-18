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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { toast } from "@/components/ui/use-toast";
import type { ApiErrorResponse } from "@/types/api";
import { getVendor, createVendor, updateVendor } from "@/modules/vendor/vendor.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Tag, Mail, Phone, Building2, Globe, FileText, DollarSign, Loader2, Save, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const vendorSchema = z.object({
  code: z.string().min(1, "Code is required").max(50),
  name: z.string().min(1, "Name is required").max(500),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(50).optional().or(z.literal("")),
  companyName: z.string().max(255).optional().or(z.literal("")),
  taxId: z.string().max(100).optional().or(z.literal("")),
  website: z.string().max(500).optional().or(z.literal("")),
  paymentTerms: z.string().max(100).optional().or(z.literal("")),
  creditLimit: z.string().optional().or(z.literal("")),
  notes: z.string().max(5000).optional().or(z.literal("")),
  status: z.string().optional().default("active"),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendorId?: string;
}

export function VendorFormModal({ open, onOpenChange, vendorId }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!vendorId;

  const { data: vendor, isLoading: loadingVendor } = useQuery({
    queryKey: CACHE_KEYS.VENDOR(vendorId!),
    queryFn: () => getVendor(vendorId!),
    enabled: isEdit && open,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      code: "", name: "", email: "", phone: "", companyName: "",
      taxId: "", website: "", paymentTerms: "", creditLimit: "",
      notes: "", status: "active",
    },
  });

  useEffect(() => {
    if (vendor) {
      reset({
        code: vendor.code,
        name: vendor.name,
        email: vendor.email || "",
        phone: vendor.phone || "",
        companyName: vendor.company_name || "",
        taxId: vendor.tax_id || "",
        website: vendor.website || "",
        paymentTerms: vendor.payment_terms || "",
        creditLimit: vendor.credit_limit ? String(vendor.credit_limit) : "",
        notes: vendor.notes || "",
        status: vendor.status,
      });
    }
  }, [vendor, reset]);

  const getErrorMsg = (err: unknown) => {
    const axiosErr = err as { response?: { data?: ApiErrorResponse } };
    const apiErr = axiosErr.response?.data?.error;
    if (apiErr?.details?.length) return apiErr.details[0].message;
    return apiErr?.message || "An unexpected error occurred";
  };

  const createMutation = useMutation({
    mutationFn: createVendor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDORS });
      toast({ title: "Vendor created", variant: "success" });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: getErrorMsg(err), variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: VendorFormValues) => {
      const payload = {
        code: data.code,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        companyName: data.companyName || null,
        taxId: data.taxId || null,
        website: data.website || null,
        paymentTerms: data.paymentTerms || null,
        creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null,
        notes: data.notes || null,
        status: data.status,
      };
      return updateVendor(vendorId!, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDORS });
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDOR(vendorId!) });
      toast({ title: "Vendor updated", variant: "success" });
      onOpenChange(false);
    },
    onError: (err) => toast({ title: getErrorMsg(err), variant: "destructive" }),
  });

  const onSubmit = (data: VendorFormValues) => {
    const payload = {
      code: data.code,
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      companyName: data.companyName || null,
      taxId: data.taxId || null,
      website: data.website || null,
      paymentTerms: data.paymentTerms || null,
      creditLimit: data.creditLimit ? parseFloat(data.creditLimit) : null,
      notes: data.notes || null,
      status: data.status,
    };
    if (isEdit) updateMutation.mutate(payload as never);
    else createMutation.mutate(payload as never);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg !gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{isEdit ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
        </DialogHeader>

        {isEdit && loadingVendor ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="overflow-y-auto max-h-[480px] px-6 py-3 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Identity</h4>
                  </div>
                  <Separator className="mb-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="code" className="text-xs">Code *</Label>
                      <Input id="code" placeholder="VEN-001" className="h-8 text-sm" {...register("code")} />
                      {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-xs">Name *</Label>
                      <Input id="name" placeholder="Vendor Name" className="h-8 text-sm" {...register("name")} />
                      {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</h4>
                  </div>
                  <Separator className="mb-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs">Email</Label>
                      <Input id="email" type="email" placeholder="vendor@example.com" className="h-8 text-sm" {...register("email")} />
                      {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-xs">Phone</Label>
                      <Input id="phone" placeholder="+1-555-0000" className="h-8 text-sm" {...register("phone")} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Business</h4>
                  </div>
                  <Separator className="mb-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="companyName" className="text-xs">Company Name</Label>
                      <Input id="companyName" placeholder="Acme Corp" className="h-8 text-sm" {...register("companyName")} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="taxId" className="text-xs">Tax ID</Label>
                      <Input id="taxId" placeholder="XX-XXXXXXX" className="h-8 text-sm" {...register("taxId")} />
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Label htmlFor="website" className="text-xs">Website</Label>
                    <Input id="website" placeholder="https://example.com" className="h-8 text-sm" {...register("website")} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Terms & Limits</h4>
                  </div>
                  <Separator className="mb-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="paymentTerms" className="text-xs">Payment Terms</Label>
                      <Input id="paymentTerms" placeholder="Net 30" className="h-8 text-sm" {...register("paymentTerms")} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="creditLimit" className="text-xs">Credit Limit ($)</Label>
                      <Input id="creditLimit" type="number" min={0} step="0.01" placeholder="50000" className="h-8 text-sm" {...register("creditLimit")} />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes</h4>
                  </div>
                  <Separator className="mb-2" />
                  <div className="space-y-1">
                    <Label htmlFor="notes" className="text-xs">Notes</Label>
                    <textarea
                      id="notes"
                      className="flex min-h-[40px] w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                      rows={2}
                      {...register("notes")}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="default" disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    isEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />
                  )}
                  {isEdit ? "Update Vendor" : "Add Vendor"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
