"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";

interface Subscriber {
  id: string;
  email: string;
  createdAt: string;
}

export function AdminNewsletterSection() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    subscribers: Subscriber[];
    total: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Subscriber | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.newsletterSubscribers({ page, search: search || undefined });
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    void load();
  }, [load]);

  function runSearch() {
    setPage(1);
    void load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteSubscriber(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Newsletter</h2>
        <p className="text-sm text-muted-foreground">
          Everyone subscribed to buying guide emails from the site.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold">Search</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email"
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
          />
        </div>
        <Button type="button" variant="outline" onClick={runSearch} className="sm:w-auto">
          Search
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data || data.subscribers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <Mail className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {search ? "No subscribers match that search." : "No subscribers yet."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop / tablet: table */}
          <div className="hidden overflow-x-auto rounded-lg border bg-white sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs text-muted-foreground">
                <tr>
                  <th className="p-3">Email</th>
                  <th className="p-3">Subscribed</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.subscribers.map((s) => (
                  <tr key={s.id} className="border-b">
                    <td className="p-3 font-medium">{s.email}</td>
                    <td className="p-3 text-muted-foreground">
                      {format(new Date(s.createdAt), "MMM d, yyyy")}
                    </td>
                    <td className="p-3">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 sm:hidden">
            {data.subscribers.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Subscribed {format(new Date(s.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => setDeleteTarget(s)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {data && totalPages > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Page {page} of {totalPages}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={loading || page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={loading || page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove subscriber?"
        description={
          deleteTarget
            ? `Remove “${deleteTarget.email}” from the newsletter list? This cannot be undone.`
            : ""
        }
        confirmLabel="Remove"
        destructive
        confirming={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
