"use client";

import { useState, useCallback } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/shared/data-table";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "@/components/ui/use-toast";
import { listAuditLogs, exportAuditLogs } from "@/modules/audit/audit.api";
import { CACHE_KEYS } from "@/lib/constants";
import { Search, ScrollText, Download, Filter, X } from "lucide-react";
import type { AuditLogEntry } from "@/modules/audit/audit.api";
import type { ColumnDef } from "@tanstack/react-table";

const ACTION_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  create: "default",
  update: "secondary",
  delete: "destructive",
  login: "outline",
  logout: "outline",
};

export default function AuditLogsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [changesEntry, setChangesEntry] = useState<AuditLogEntry | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CACHE_KEYS.AUDIT_LOGS, { page, limit: 20, search, action: actionFilter || undefined }],
    queryFn: () => listAuditLogs({ page, limit: 20, search: search || undefined, action: actionFilter || undefined }),
    placeholderData: keepPreviousData,
  });

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const logs = await exportAuditLogs({ action: actionFilter || undefined });
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, [actionFilter]);

  const columns: ColumnDef<AuditLogEntry>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.original.action;
        const actionName = action.split(".").pop() || action;
        return <Badge variant={ACTION_COLORS[actionName] || "outline"}>{action}</Badge>;
      },
    },
    {
      accessorKey: "auditableType",
      header: "Entity",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.auditableType}</span>
      ),
    },
    {
      accessorKey: "user",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user;
        return user ? `${user.firstName} ${user.lastName}` : row.original.userId?.slice(0, 8) || "—";
      },
    },
    {
      accessorKey: "ipAddress",
      header: "IP",
      cell: ({ row }) => row.original.ipAddress || "—",
    },
    {
      id: "changes",
      header: "Details",
      cell: ({ row }) => {
        const changes = row.original.changes;
        if (!changes) return "—";
        return (
          <Button variant="ghost" size="sm" onClick={() => setChangesEntry(row.original)}>
            View
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Logs</h2>
          <p className="text-muted-foreground">Track all changes and events across the system</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border rounded-md px-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="border-0 bg-transparent py-1 text-sm focus:outline-none"
              value={actionFilter}
              onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            >
              <option value="">All actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" /> {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit logs..."
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
            <EmptyState icon={<ScrollText className="h-12 w-12" />} title="Failed to load audit logs" description="Try refreshing the page" />
          ) : data && data.data.length > 0 ? (
            <DataTable
              columns={columns}
              data={data.data}
              total={data.meta.total}
              pageIndex={page - 1}
              onPageChange={(p) => setPage(p + 1)}
            />
          ) : (
            <EmptyState icon={<ScrollText className="h-12 w-12" />} title="No audit logs found" description="Actions will appear here as users interact with the system" />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!changesEntry} onOpenChange={(o) => { if (!o) setChangesEntry(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Details</DialogTitle>
          </DialogHeader>
          {changesEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Action:</span>{" "}
                  <Badge variant={ACTION_COLORS[changesEntry.action.split(".").pop() || changesEntry.action] || "outline"}>
                    {changesEntry.action}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity:</span>{" "}
                  <span className="font-mono text-xs">{changesEntry.auditableType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Entity ID:</span>{" "}
                  <span className="font-mono text-xs">{changesEntry.auditableId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>{" "}
                  {new Date(changesEntry.createdAt).toLocaleString()}
                </div>
                {changesEntry.user && (
                  <div>
                    <span className="text-muted-foreground">User:</span>{" "}
                    {changesEntry.user.firstName} {changesEntry.user.lastName} ({changesEntry.user.email})
                  </div>
                )}
                {changesEntry.ipAddress && (
                  <div>
                    <span className="text-muted-foreground">IP:</span> {changesEntry.ipAddress}
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Changes Data</h4>
                <pre className="bg-muted rounded-md p-4 text-xs overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
                  {JSON.stringify(changesEntry.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
