"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/ui/use-toast";
import { getChecklist, deleteChecklist } from "@/modules/quality/quality.api";
import { CACHE_KEYS, ROUTES } from "@/lib/constants";
import { ArrowLeft, Trash2, ClipboardList, Ruler, GripVertical } from "lucide-react";

export default function ChecklistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const id = params.id as string;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: checklist, isLoading, isError } = useQuery({
    queryKey: CACHE_KEYS.QC_CHECKLIST(id),
    queryFn: () => getChecklist(id),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteChecklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CACHE_KEYS.QC_CHECKLISTS });
      toast({ title: "Checklist deleted", variant: "success" });
      router.push(ROUTES.QUALITY_CHECKLISTS);
    },
    onError: () => toast({ title: "Failed to delete checklist", variant: "destructive" }),
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError || !checklist) return <p className="text-destructive">Failed to load checklist</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push(ROUTES.QUALITY_CHECKLISTS)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{checklist.name}</h2>
            <p className="text-muted-foreground text-sm">{checklist.description || "No description"}</p>
          </div>
          <Badge variant={checklist.is_active ? "success" : "secondary"}>
            {checklist.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Checklist Items ({checklist.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {checklist.items.length > 0 ? (
            <div className="space-y-2">
              {checklist.items
                .sort((a, b) => a.sequence - b.sequence)
                .map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.description}</span>
                        {item.is_critical && <Badge variant="destructive" className="text-[10px]">Critical</Badge>}
                      </div>
                      {item.expected_value && (
                        <p className="text-xs text-muted-foreground">Expected: {item.expected_value}</p>
                      )}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        {item.min_value != null && <span>Min: {item.min_value}</span>}
                        {item.max_value != null && <span>Max: {item.max_value}</span>}
                        {item.unit && <span>Unit: {item.unit}</span>}
                        {item.inspection_method && <span>Method: {item.inspection_method}</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No items in this checklist</p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Checklist"
        description={`Are you sure you want to delete "${checklist.name}"?`}
        onConfirm={() => deleteMutation.mutate()}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
