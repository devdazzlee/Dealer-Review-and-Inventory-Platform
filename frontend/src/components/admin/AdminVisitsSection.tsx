"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { adminApi } from "@/lib/api/admin-client";
import { Button } from "@/components/ui/button";

interface VisitsSummary {
  total: number;
  byState: { stateCode: string; count: number }[];
  topCities: { city: string; stateCode: string; count: number }[];
  recent: { city: string; stateCode: string; path: string | null; createdAt: string }[];
}

export function AdminVisitsSection() {
  const [data, setData] = useState<VisitsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await adminApi.visitsSummary();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const maxStateCount = data?.byState[0]?.count ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Visitors</h2>
          <p className="text-sm text-muted-foreground">
            Where visitors are coming from, based on automatic IP location
            detection — logged once per new visitor, not every page view.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : !data || data.total === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No visitor locations detected yet.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Total visitors detected
            </p>
            <p className="mt-1 text-3xl font-bold text-primary">{data.total}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">By state</h3>
              <div className="space-y-2.5">
                {data.byState.map((row) => (
                  <div key={row.stateCode} className="flex items-center gap-3">
                    <span className="w-9 shrink-0 text-sm font-semibold text-foreground">
                      {row.stateCode}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${maxStateCount ? (row.count / maxStateCount) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-10 shrink-0 text-right text-sm text-muted-foreground">
                      {row.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">Top cities</h3>
              <div className="space-y-2">
                {data.topCities.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  data.topCities.map((row) => (
                    <div
                      key={`${row.city}-${row.stateCode}`}
                      className="flex items-center justify-between border-b border-border/60 py-1.5 text-sm last:border-0"
                    >
                      <span className="font-medium">
                        {row.city}, {row.stateCode}
                      </span>
                      <span className="text-muted-foreground">{row.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-white">
            <h3 className="border-b p-4 text-sm font-semibold">Recent visits</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-slate-50 text-xs text-muted-foreground">
                  <tr>
                    <th className="p-3">Location</th>
                    <th className="p-3">Landing page</th>
                    <th className="p-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-3 font-medium">
                        {row.city}, {row.stateCode}
                      </td>
                      <td className="p-3 text-muted-foreground">{row.path || "—"}</td>
                      <td className="p-3 text-muted-foreground">
                        {format(new Date(row.createdAt), "MMM d, yyyy h:mm a")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
