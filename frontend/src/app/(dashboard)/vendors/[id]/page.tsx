"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import {
  getVendor, deleteVendor,
  listVendorContacts, createVendorContact, deleteVendorContact,
  listVendorContracts, createVendorContract, deleteVendorContract,
  listVendorPurchaseOrders,
  type VendorContact, type VendorContract, type VendorPurchaseOrder,
  type CreateContactPayload, type CreateContractPayload,
} from "@/modules/vendor/vendor.api";
import { VendorFormModal } from "@/modules/vendor/components/vendor-form-modal";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Globe,
  UserPlus, Plus, FileText, ShoppingCart, DollarSign, Calendar,
} from "lucide-react";


type Tab = "details" | "contacts" | "contracts" | "purchase-orders";

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const { data: vendor, isLoading } = useQuery({
    queryKey: CACHE_KEYS.VENDOR(id),
    queryFn: () => getVendor(id),
  });

  const { data: contacts } = useQuery({
    queryKey: CACHE_KEYS.VENDOR_CONTACTS(id),
    queryFn: () => listVendorContacts(id),
    enabled: activeTab === "contacts",
  });

  const { data: contracts } = useQuery({
    queryKey: CACHE_KEYS.VENDOR_CONTRACTS(id),
    queryFn: () => listVendorContracts(id),
    enabled: activeTab === "contracts",
  });

  const { data: poData } = useQuery({
    queryKey: CACHE_KEYS.VENDOR_PURCHASE_ORDERS(id),
    queryFn: () => listVendorPurchaseOrders(id),
    enabled: activeTab === "purchase-orders",
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDORS });
      toast({ title: "Vendor deleted", variant: "success" });
      router.push(ROUTES.VENDORS);
    },
    onError: () => toast({ title: "Failed to delete vendor", variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!vendor) return <p className="text-muted-foreground">Vendor not found</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "contacts", label: "Contacts" },
    { key: "contracts", label: "Contracts" },
    { key: "purchase-orders", label: "Purchase Orders" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.VENDORS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{vendor.name}</h2>
            <p className="text-muted-foreground text-sm">{vendor.code}</p>
          </div>
          <Badge variant={vendor.status === "active" ? "success" : "secondary"}>{vendor.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteId(id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "details" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>{vendor.company_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ID</span><span>{vendor.tax_id || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Website</span><span>{vendor.website ? <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{vendor.website}</a> : "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Payment Terms</span><span>{vendor.payment_terms || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Credit Limit</span><span>{vendor.credit_limit ? `$${Number(vendor.credit_limit).toLocaleString()}` : "—"}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{vendor.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{vendor.phone || "—"}</span></div>
            </CardContent>
          </Card>
          {vendor.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{vendor.notes}</p></CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "contacts" && <ContactsTab vendorId={id} contacts={contacts || []} />}
      {activeTab === "contracts" && <ContractsTab vendorId={id} contracts={contracts || []} />}
      {activeTab === "purchase-orders" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" /> Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {poData && poData.data.length > 0 ? (
              <div className="space-y-2">
                {poData.data.map((po: VendorPurchaseOrder) => (
                  <div key={po.id} className="flex justify-between items-center rounded-lg border p-3 text-sm">
                    <span className="font-medium">{po.po_number}</span>
                    <Badge variant={po.status === "received" ? "success" : po.status === "cancelled" ? "destructive" : "secondary"}>
                      {po.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No purchase orders found</p>
            )}
          </CardContent>
        </Card>
      )}

      <VendorFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        vendorId={id}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Vendor"
        description="Are you sure you want to delete this vendor?"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function ContactsTab({ vendorId, contacts }: { vendorId: string; contacts: VendorContact[] }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<Partial<CreateContactPayload>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateContactPayload) => createVendorContact(vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDOR_CONTACTS(vendorId) });
      toast({ title: "Contact added", variant: "success" });
      setShowAddForm(false);
      setForm({});
    },
    onError: () => toast({ title: "Failed to add contact", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => deleteVendorContact(vendorId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDOR_CONTACTS(vendorId) });
      toast({ title: "Contact deleted", variant: "success" });
    },
    onError: () => toast({ title: "Failed to delete contact", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Contacts
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1 h-3 w-3" /> Add Contact
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm && (
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">First Name</Label>
                <Input className="h-8 text-xs" placeholder="John" value={form.firstName || ""}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name</Label>
                <Input className="h-8 text-xs" placeholder="Doe" value={form.lastName || ""}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input className="h-8 text-xs" type="email" placeholder="john@example.com" value={form.email || ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input className="h-8 text-xs" placeholder="+1-555-0000" value={form.phone || ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Position</Label>
                <Input className="h-8 text-xs" placeholder="CEO" value={form.position || ""}
                  onChange={(e) => setForm({ ...form, position: e.target.value })} />
              </div>
              <div className="space-y-1 flex items-end">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={form.isPrimary || false}
                    onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })} />
                  Primary Contact
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setForm({}); }}>Cancel</Button>
              <Button size="sm" disabled={createMutation.isPending}
                onClick={() => createMutation.mutate(form as CreateContactPayload)}>
                Save Contact
              </Button>
            </div>
          </div>
        )}

        {contacts.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground">No contacts on file</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-lg border p-3">
                <div className="text-sm">
                  <span className="font-medium">{[c.first_name, c.last_name].filter(Boolean).join(" ")}</span>
                  {c.is_primary && <Badge variant="outline" className="ml-2 text-xs">Primary</Badge>}
                  <p className="text-muted-foreground mt-1">
                    {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>}
                    {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
                    {c.position && <span>{c.position}</span>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContractsTab({ vendorId, contracts }: { vendorId: string; contracts: VendorContract[] }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<Partial<CreateContractPayload>>({ status: "active" });

  const createMutation = useMutation({
    mutationFn: (data: CreateContractPayload) => createVendorContract(vendorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDOR_CONTRACTS(vendorId) });
      toast({ title: "Contract added", variant: "success" });
      setShowAddForm(false);
      setForm({ status: "active" });
    },
    onError: () => toast({ title: "Failed to add contract", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (contractId: string) => deleteVendorContract(vendorId, contractId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.VENDOR_CONTRACTS(vendorId) });
      toast({ title: "Contract deleted", variant: "success" });
    },
    onError: () => toast({ title: "Failed to delete contract", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" /> Contracts
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1 h-3 w-3" /> Add Contract
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm && (
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Title *</Label>
                <Input className="h-8 text-xs" placeholder="Supply Agreement" value={form.title || ""}
                  onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Contract #</Label>
                <Input className="h-8 text-xs" placeholder="CNT-001" value={form.contractNumber || ""}
                  onChange={(e) => setForm({ ...form, contractNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Date</Label>
                <Input className="h-8 text-xs" type="date" value={form.startDate || ""}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">End Date</Label>
                <Input className="h-8 text-xs" type="date" value={form.endDate || ""}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Value</Label>
                <Input className="h-8 text-xs" type="number" step="0.01" placeholder="0.00" value={form.value ?? ""}
                  onChange={(e) => setForm({ ...form, value: e.target.value ? parseFloat(e.target.value) : null })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                  value={form.status || "active"}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">File URL</Label>
                <Input className="h-8 text-xs" placeholder="https://..." value={form.fileUrl || ""}
                  onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Terms</Label>
                <textarea
                  className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                  placeholder="Contract terms and conditions..."
                  value={form.terms || ""}
                  onChange={(e) => setForm({ ...form, terms: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setForm({ status: "active" }); }}>Cancel</Button>
              <Button size="sm" disabled={!form.title || createMutation.isPending}
                onClick={() => createMutation.mutate(form as CreateContractPayload)}>
                Save Contract
              </Button>
            </div>
          </div>
        )}

        {contracts.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground">No contracts on file</p>
        ) : (
          <div className="space-y-3">
            {contracts.map((c) => (
              <div key={c.id} className="flex items-start justify-between rounded-lg border p-3">
                <div className="text-sm flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.title}</span>
                    <Badge variant={c.status === "active" ? "success" : c.status === "expired" || c.status === "terminated" ? "destructive" : "secondary"}>
                      {c.status}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 space-y-1">
                    {c.contract_number && <span className="block"># {c.contract_number}</span>}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {c.start_date ? new Date(c.start_date).toLocaleDateString() : "—"} → {c.end_date ? new Date(c.end_date).toLocaleDateString() : "—"}
                    </span>
                    {c.value && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {Number(c.value).toLocaleString()}</span>}
                    {c.terms && <span className="block text-xs mt-1 italic">{c.terms}</span>}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
