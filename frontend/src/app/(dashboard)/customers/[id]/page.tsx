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
  getCustomer, deleteCustomer, listCustomerAddresses, createCustomerAddress,
  updateCustomerAddress, deleteCustomerAddress, listCustomerContacts,
  createCustomerContact, updateCustomerContact, deleteCustomerContact,
  listCustomerNotes, createCustomerNote,
} from "@/modules/customer/customer.api";
import { CustomerFormModal } from "@/modules/customer/components/customer-form-modal";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import {
  ArrowLeft, Pencil, Trash2, Mail, Phone, Building2, Globe,
  MapPin, UserPlus, Plus, StickyNote,
} from "lucide-react";
import type { CustomerAddress, CustomerContact, CustomerNote, CreateAddressPayload, CreateContactPayload, UpdateAddressPayload, UpdateContactPayload } from "@/modules/customer/customer.api";

type Tab = "details" | "addresses" | "contacts" | "notes";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("details");
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: customer, isLoading } = useQuery({
    queryKey: CACHE_KEYS.CUSTOMER(id),
    queryFn: () => getCustomer(id),
  });

  const { data: addresses } = useQuery({
    queryKey: CACHE_KEYS.CUSTOMER_ADDRESSES(id),
    queryFn: () => listCustomerAddresses(id),
    enabled: activeTab === "addresses",
  });

  const { data: contacts } = useQuery({
    queryKey: CACHE_KEYS.CUSTOMER_CONTACTS(id),
    queryFn: () => listCustomerContacts(id),
    enabled: activeTab === "contacts",
  });

  const { data: notes } = useQuery({
    queryKey: CACHE_KEYS.CUSTOMER_NOTES(id),
    queryFn: () => listCustomerNotes(id),
    enabled: activeTab === "notes",
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMERS });
      toast({ title: "Customer deleted", variant: "success" });
      router.push(ROUTES.CUSTOMERS);
    },
    onError: () => toast({ title: "Failed to delete customer", variant: "destructive" }),
  });

  const createNoteMutation = useMutation({
    mutationFn: (content: string) => createCustomerNote(id, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMER_NOTES(id) });
      toast({ title: "Note added", variant: "success" });
    },
    onError: () => toast({ title: "Failed to add note", variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!customer) return <p className="text-muted-foreground">Customer not found</p>;

  const tabs: { key: Tab; label: string }[] = [
    { key: "details", label: "Details" },
    { key: "addresses", label: "Addresses" },
    { key: "contacts", label: "Contacts" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.CUSTOMERS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{customer.name}</h2>
            <p className="text-muted-foreground text-sm">{customer.code}</p>
          </div>
          <Badge variant={customer.status === "active" ? "success" : "secondary"}>{customer.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteId(id)}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {/* Tabs */}
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

      {/* Details Tab */}
      {activeTab === "details" && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>{customer.company_name || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tax ID</span><span>{customer.tax_id || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Website</span><span>{customer.website ? <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{customer.website}</a> : "—"}</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" /> Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{customer.email || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{customer.phone || "—"}</span></div>
            </CardContent>
          </Card>
          {customer.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <StickyNote className="h-4 w-4" /> Notes
                </CardTitle>
              </CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{customer.notes}</p></CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === "addresses" && <AddressesTab customerId={id} addresses={addresses || []} />}

      {/* Contacts Tab */}
      {activeTab === "contacts" && <ContactsTab customerId={id} contacts={contacts || []} />}

      {/* Notes Tab */}
      {activeTab === "notes" && (
        <NotesTab customerId={id} notes={notes || []} onAdd={createNoteMutation.mutate} />
      )}

      <CustomerFormModal open={showEditModal} onOpenChange={setShowEditModal} customerId={id} />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        title="Delete Customer"
        description="Are you sure you want to delete this customer?"
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function AddressesTab({ customerId, addresses }: { customerId: string; addresses: CustomerAddress[] }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState<Partial<CreateAddressPayload>>({ type: "shipping", country: "US" });

  const createMutation = useMutation({
    mutationFn: (data: CreateAddressPayload) => createCustomerAddress(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMER_ADDRESSES(customerId) });
      toast({ title: "Address added", variant: "success" });
      setShowAddForm(false);
      setNewAddr({ type: "shipping", country: "US" });
    },
    onError: () => toast({ title: "Failed to add address", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (addrId: string) => deleteCustomerAddress(customerId, addrId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMER_ADDRESSES(customerId) });
      toast({ title: "Address deleted", variant: "success" });
    },
    onError: () => toast({ title: "Failed to delete address", variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" /> Addresses
        </CardTitle>
        <Button variant="outline" size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="mr-1 h-3 w-3" /> Add Address
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showAddForm && (
          <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Type</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-background px-3 text-xs"
                  value={newAddr.type || "shipping"}
                  onChange={(e) => setNewAddr({ ...newAddr, type: e.target.value })}
                >
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Country</Label>
                <Input className="h-8 text-xs" placeholder="US" value={newAddr.country || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Address Line 1</Label>
                <Input className="h-8 text-xs" placeholder="123 Main St" value={newAddr.addressLine1 || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })} />
              </div>
              <div className="space-y-1 col-span-2">
                <Label className="text-xs">Address Line 2</Label>
                <Input className="h-8 text-xs" placeholder="Suite 100" value={newAddr.addressLine2 || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">City</Label>
                <Input className="h-8 text-xs" placeholder="New York" value={newAddr.city || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">State</Label>
                <Input className="h-8 text-xs" placeholder="NY" value={newAddr.state || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Postal Code</Label>
                <Input className="h-8 text-xs" placeholder="10001" value={newAddr.postalCode || ""}
                  onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })} />
              </div>
              <div className="space-y-1 flex items-end">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={newAddr.isDefault || false}
                    onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })} />
                  Default
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewAddr({ type: "shipping", country: "US" }); }}>Cancel</Button>
              <Button size="sm" disabled={!newAddr.addressLine1 || !newAddr.country || createMutation.isPending}
                onClick={() => createMutation.mutate(newAddr as CreateAddressPayload)}>
                Save Address
              </Button>
            </div>
          </div>
        )}

        {addresses.length === 0 && !showAddForm ? (
          <p className="text-sm text-muted-foreground">No addresses on file</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between rounded-lg border p-3">
                <div className="text-sm">
                  <span className="font-medium capitalize">{addr.type}</span>
                  {addr.is_default && <Badge variant="outline" className="ml-2 text-xs">Default</Badge>}
                  <p className="text-muted-foreground mt-1">
                    {addr.address_line1}{addr.address_line2 ? `, ${addr.address_line2}` : ""}
                    <br />
                    {[addr.city, addr.state, addr.postal_code].filter(Boolean).join(", ")}
                    <br />
                    {addr.country}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(addr.id)}>
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

function ContactsTab({ customerId, contacts }: { customerId: string; contacts: CustomerContact[] }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContact, setNewContact] = useState<Partial<CreateContactPayload>>({});

  const createMutation = useMutation({
    mutationFn: (data: CreateContactPayload) => createCustomerContact(customerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMER_CONTACTS(customerId) });
      toast({ title: "Contact added", variant: "success" });
      setShowAddForm(false);
      setNewContact({});
    },
    onError: () => toast({ title: "Failed to add contact", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (contactId: string) => deleteCustomerContact(customerId, contactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.CUSTOMER_CONTACTS(customerId) });
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
                <Label className="text-xs">First Name *</Label>
                <Input className="h-8 text-xs" placeholder="John" value={newContact.firstName || ""}
                  onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Last Name</Label>
                <Input className="h-8 text-xs" placeholder="Doe" value={newContact.lastName || ""}
                  onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Email</Label>
                <Input className="h-8 text-xs" type="email" placeholder="john@example.com" value={newContact.email || ""}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Phone</Label>
                <Input className="h-8 text-xs" placeholder="+1-555-0000" value={newContact.phone || ""}
                  onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Position</Label>
                <Input className="h-8 text-xs" placeholder="CEO" value={newContact.position || ""}
                  onChange={(e) => setNewContact({ ...newContact, position: e.target.value })} />
              </div>
              <div className="space-y-1 flex items-end">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={newContact.isPrimary || false}
                    onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })} />
                  Primary Contact
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewContact({}); }}>Cancel</Button>
              <Button size="sm" disabled={!newContact.firstName || createMutation.isPending}
                onClick={() => createMutation.mutate(newContact as CreateContactPayload)}>
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

function NotesTab({
  customerId, notes, onAdd,
}: {
  customerId: string; notes: CustomerNote[]; onAdd: (content: string) => void;
}) {
  const [newNote, setNewNote] = useState("");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <StickyNote className="h-4 w-4" /> Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <textarea
            className="flex-1 min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Add a note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          <Button
            variant="default"
            size="sm"
            className="self-end"
            disabled={!newNote.trim()}
            onClick={() => { onAdd(newNote); setNewNote(""); }}
          >
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet</p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="rounded-lg border p-3">
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {note.created_by_name && <span>{note.created_by_name} · </span>}
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
