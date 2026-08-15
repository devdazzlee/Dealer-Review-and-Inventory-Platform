"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  AlertCircle,
  Calendar,
  Check,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Flag,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Pencil,
  Percent,
  Plus,
  Settings2,
  Shield,
  Star,
  Store,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  adminApi,
  clearAdminToken,
  getAdminToken,
  setAdminToken,
  type AdminDealer,
  type AdminReport,
  type AdminReview,
  type RatingSettings,
} from "@/lib/api/admin-client";
import { calculateCombinedPreview } from "@/lib/dealers/rating-math";
import { STATES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AdminBlogSection } from "@/components/admin/AdminBlogSection";
import { AdminNewsletterSection } from "@/components/admin/AdminNewsletterSection";
import { AdminSearchableSelect } from "@/components/admin/AdminSearchableSelect";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { env } from "@/config/env";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

type Section =
  | "dashboard"
  | "reviews"
  | "dealers"
  | "ratings"
  | "badges"
  | "reports"
  | "blog"
  | "newsletter"
  | "security";

type ReviewAction = "approve" | "reject" | "delete";

const SECTIONS: { key: Section; label: string; icon: typeof Store }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "dealers", label: "Dealers", icon: Store },
  { key: "ratings", label: "Rating Sources", icon: Settings2 },
  { key: "badges", label: "Badges", icon: Shield },
  { key: "reports", label: "Reports", icon: Flag },
  { key: "blog", label: "Blog", icon: Newspaper },
  { key: "newsletter", label: "Newsletter", icon: Mail },
  { key: "security", label: "Security", icon: KeyRound },
];

function AdminLoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-border/70 bg-white p-10 ",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-3" aria-hidden>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="min-w-[132px] flex-1 basis-[calc(50%-0.375rem)] rounded-lg border border-border bg-white p-3.5 sm:basis-36 sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="mt-3 h-7 w-12 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        Loading dashboard…
      </div>
      <StatCardsSkeleton count={8} />
      <div className="rounded-lg border border-border/70 bg-white p-5">
        <div className="mb-4 h-5 w-36 animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0"
            >
              <div className="space-y-2">
                <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                <div className="h-3 w-32 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-5 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border/70 bg-white"
      aria-busy="true"
      aria-label="Loading table"
    >
      <div className="flex items-center gap-2 border-b bg-secondary/50 px-4 py-3 text-sm font-semibold text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        Loading…
      </div>
      <div className="divide-y divide-border/60 p-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-3 px-2 py-3">
            <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RatingsSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading rating settings">
      <StatCardsSkeleton count={4} />
      <div className="space-y-4 rounded-lg border bg-white p-5">
        <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg border border-border/70 px-4 py-3"
            >
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="h-6 w-11 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BadgesSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading badges">
      <StatCardsSkeleton count={4} />
      <div className="rounded-lg border bg-white p-4 sm:p-5">
        <div className="mb-3 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-64" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-28" />
          <div className="h-10 w-full animate-pulse rounded-md bg-muted sm:w-24" />
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-3 w-56 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading reports">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-lg border border-border bg-white p-4">
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-4 w-40 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-56 animate-pulse rounded bg-muted" />
          <div className="mt-3 h-3 w-full max-w-md animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function LoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.login(password);
      setAdminToken(result.token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-white p-6"
      >
        <div>
          <BrandLogo />
          <h1 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your password to continue.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="admin-password"
            className="block text-xs font-medium text-muted-foreground"
          >
            Password
          </label>
          <div className="relative">
            <Input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="h-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
}

function DashboardSection({
  onNavigate,
}: {
  onNavigate: (section: Section) => void;
}) {
  const [data, setData] = useState<Awaited<
    ReturnType<typeof adminApi.dashboard>
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<{
    title: string;
    loading: boolean;
    rows: StatDetailRow[];
    total: number;
    page: number;
    pageSize: number;
    navigateLabel: string;
    navigateTo: Section;
    source: DetailSource;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await adminApi.dashboard());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function fetchDetailPage(source: DetailSource, page: number) {
    if (source.kind === "dealers") {
      const result = await adminApi.dealers({ ...source.params, page });
      return {
        total: result.total,
        pageSize: result.pageSize,
        rows: result.dealers.map((d) => ({
          id: d.id,
          primary: d.name,
          secondary: `${d.city}, ${d.state}`,
          badge: d.combinedRating != null ? `${d.combinedRating.toFixed(1)}★` : "—",
        })),
      };
    }
    const result = await adminApi.reviews({ ...source.params, page });
    return {
      total: result.total,
      pageSize: result.pageSize,
      rows: result.reviews.map((r) => ({
        id: r.id,
        primary: r.title,
        secondary: `${r.authorName} · ${r.dealer.name}`,
        badge: `${r.overallRating}★`,
      })),
    };
  }

  async function openDetail(
    title: string,
    navigateLabel: string,
    navigateTo: Section,
    source: DetailSource
  ) {
    setDetail({
      title,
      loading: true,
      rows: [],
      total: 0,
      page: 1,
      pageSize: 20,
      navigateLabel,
      navigateTo,
      source,
    });
    try {
      const { total, pageSize, rows } = await fetchDetailPage(source, 1);
      setDetail({
        title,
        loading: false,
        rows,
        total,
        page: 1,
        pageSize,
        navigateLabel,
        navigateTo,
        source,
      });
    } catch {
      setDetail({
        title,
        loading: false,
        rows: [],
        total: 0,
        page: 1,
        pageSize: 20,
        navigateLabel,
        navigateTo,
        source,
      });
    }
  }

  async function changeDetailPage(page: number) {
    if (!detail) return;
    setDetail({ ...detail, loading: true });
    try {
      const { total, pageSize, rows } = await fetchDetailPage(detail.source, page);
      setDetail({ ...detail, loading: false, rows, total, page, pageSize });
    } catch {
      setDetail({ ...detail, loading: false });
    }
  }

  function showDealers(
    title: string,
    navigateLabel: string,
    params: { featured?: boolean; hasBadge?: boolean }
  ) {
    return openDetail(title, navigateLabel, "dealers", { kind: "dealers", params });
  }

  function showReviews(title: string, navigateLabel: string, status?: string) {
    return openDetail(title, navigateLabel, "reviews", {
      kind: "reviews",
      params: { status },
    });
  }

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-semibold text-destructive">{error}</p>
        <Button type="button" className="mt-4" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Dealers"
          value={data.dealers}
          icon={Store}
          tone="primary"
          onClick={() => void showDealers("All Dealers", "View all dealers", {})}
        />
        <StatCard
          label="Featured"
          value={data.dealersFeatured}
          icon={Star}
          tone="accent"
          onClick={() =>
            void showDealers("Featured Dealers", "View featured dealers", {
              featured: true,
            })
          }
        />
        <StatCard
          label="Badged"
          value={data.dealersBadged}
          icon={Shield}
          tone="accent"
          onClick={() =>
            void showDealers("Badged Dealers", "View badges", { hasBadge: true })
          }
        />
        <StatCard
          label="Total Reviews"
          value={data.reviews.total}
          icon={Star}
          tone="primary"
          onClick={() => void showReviews("All Reviews", "View all reviews")}
        />
        <StatCard
          label="Pending"
          value={data.reviews.pending}
          icon={Clock}
          tone="warning"
          urgent={data.pendingUrgent}
          onClick={() =>
            void showReviews("Pending Reviews", "Review pending", "pending")
          }
        />
        <StatCard
          label="Approved / Rejected"
          value={`${data.reviews.approved} / ${data.reviews.rejected}`}
          icon={Check}
          tone="success"
          onClick={() =>
            void showReviews("Approved Reviews", "View reviews", "approved")
          }
        />
        <StatCard
          label="Open Reports"
          value={data.reports.open}
          icon={Flag}
          tone="warning"
          urgent={data.reports.open > 0}
          onClick={() => onNavigate("reports")}
        />
        <StatCard
          label="Newsletter Subscribers"
          value={data.newsletterSubscribers}
          icon={Mail}
          tone="primary"
          onClick={() => onNavigate("newsletter")}
        />
      </div>

      <div className="rounded-lg border border-border bg-white p-4 sm:p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">
          Recent activity
        </h2>
        {data.recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {data.recentActivity.map((item) => (
              <li
                key={item.id}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                  {item.authorName.slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    <span className="font-medium text-foreground">
                      {item.authorName}
                    </span>{" "}
                    <span className="text-muted-foreground">reviewed</span>{" "}
                    <span className="font-medium text-foreground">
                      {item.dealerName}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                      {item.overallRating}
                      <Star className="h-3 w-3 fill-accent text-accent" />
                    </span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{item.title}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusBadge status={item.status} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <StatDetailDialog
        detail={detail}
        onClose={() => setDetail(null)}
        onNavigate={onNavigate}
        onPageChange={(page) => void changeDetailPage(page)}
      />
    </div>
  );
}

type DetailSource =
  | { kind: "dealers"; params: { featured?: boolean; hasBadge?: boolean } }
  | { kind: "reviews"; params: { status?: string } };

const STAT_TONES = {
  primary: "text-muted-foreground",
  success: "text-muted-foreground",
  warning: "text-muted-foreground",
  destructive: "text-muted-foreground",
  accent: "text-muted-foreground",
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  urgent,
  active,
  onClick,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: keyof typeof STAT_TONES;
  urgent?: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "min-w-[132px] flex-1 basis-[calc(50%-0.375rem)] rounded-lg border bg-white p-3.5 text-left transition-colors sm:basis-36 sm:p-4",
        active
          ? "border-primary/40 bg-secondary/40"
          : "border-border",
        onClick && "cursor-pointer hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <Icon className={cn("h-3.5 w-3.5 shrink-0", STAT_TONES[tone])} />
        )}
      </div>
      <p className="mt-2 flex flex-wrap items-baseline gap-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
        {urgent && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Needs review
          </span>
        )}
      </p>
    </Component>
  );
}

interface StatDetailRow {
  id: string;
  primary: string;
  secondary?: string;
  badge?: string;
}

function StatDetailDialog({
  detail,
  onClose,
  onNavigate,
  onPageChange,
}: {
  detail: {
    title: string;
    loading: boolean;
    rows: StatDetailRow[];
    total: number;
    page: number;
    pageSize: number;
    navigateLabel: string;
    navigateTo: Section;
  } | null;
  onClose: () => void;
  onNavigate: (section: Section) => void;
  onPageChange: (page: number) => void;
}) {
  const totalPages = detail
    ? Math.max(1, Math.ceil(detail.total / detail.pageSize))
    : 1;
  const rangeStart = detail && detail.total > 0 ? (detail.page - 1) * detail.pageSize + 1 : 0;
  const rangeEnd = detail ? Math.min(detail.page * detail.pageSize, detail.total) : 0;

  return (
    <Dialog open={Boolean(detail)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <DialogTitle>{detail?.title}</DialogTitle>
          {!detail?.loading && detail && detail.total > 0 && (
            <DialogDescription>
              Showing {rangeStart}–{rangeEnd} of {detail.total}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-[220px] flex-1 space-y-2 overflow-y-auto p-5">
          {detail?.loading ? (
            <div className="flex h-full min-h-[220px] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !detail || detail.rows.length === 0 ? (
            <div className="flex h-full min-h-[220px] items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Nothing to show here yet.
              </p>
            </div>
          ) : (
            detail.rows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-white px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {row.primary}
                  </p>
                  {row.secondary && (
                    <p className="truncate text-xs text-muted-foreground">
                      {row.secondary}
                    </p>
                  )}
                </div>
                {row.badge && (
                  <span className="shrink-0 text-sm font-medium text-foreground">
                    {row.badge}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {detail && detail.total > detail.pageSize && (
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-3">
            <span className="text-sm text-muted-foreground">
              Page {detail.page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={detail.loading || detail.page <= 1}
                onClick={() => onPageChange(detail.page - 1)}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={detail.loading || detail.page >= totalPages}
                onClick={() => onPageChange(detail.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <DialogFooter className="shrink-0 border-t border-border px-5 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          {detail && (
            <Button
              type="button"
              onClick={() => {
                onNavigate(detail.navigateTo);
                onClose();
              }}
            >
              {detail.navigateLabel}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === "pending"
      ? "Pending"
      : status === "approved"
        ? "Approved"
        : status === "rejected"
          ? "Rejected"
          : status;

  return (
    <Badge
      variant={
        status === "pending"
          ? "neutral"
          : status === "approved"
            ? "navySoft"
            : status === "rejected"
              ? "outline"
              : "neutral"
      }
      className={cn(
        "font-medium capitalize",
        status === "rejected" && "border-destructive/30 text-destructive"
      )}
    >
      {label}
    </Badge>
  );
}

function ReviewRow({
  review,
  selected,
  actionKey,
  onToggleSelect,
  onView,
  onRequestAction,
}: {
  review: AdminReview;
  selected: boolean;
  actionKey: string | null;
  onToggleSelect: (checked: boolean) => void;
  onView: () => void;
  onRequestAction: (action: ReviewAction) => void;
}) {
  const busy = actionKey?.startsWith(`${review.id}:`) ?? false;
  const is = (action: ReviewAction) => actionKey === `${review.id}:${action}`;

  return (
    <tr className="border-b border-border/50 hover:bg-slate-50/80">
      <td className="px-3 py-2.5">
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onToggleSelect(checked === true)}
        />
      </td>
      <td className="max-w-[10rem] px-3 py-2.5 text-sm font-medium text-foreground">
        <span className="block truncate" title={review.dealer.name}>
          {review.dealer.name}
        </span>
      </td>
      <td className="max-w-[8rem] px-3 py-2.5 text-sm text-muted-foreground">
        <span className="block truncate" title={review.authorName}>
          {review.authorName}
        </span>
      </td>
      <td className="px-3 py-2.5 text-sm tabular-nums text-foreground">
        {review.overallRating}
      </td>
      <td className="max-w-[14rem] overflow-hidden px-3 py-2.5">
        <button
          type="button"
          title={review.title}
          className="block w-full min-w-0 truncate text-left text-sm font-medium text-foreground hover:underline"
          onClick={onView}
        >
          {review.title}
        </button>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-sm text-muted-foreground">
        {format(new Date(review.createdAt), "MMM d, yyyy")}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={review.status} />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground"
            onClick={onView}
            aria-label="View review"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {/* Only offer the transition that changes status — approve when not
              already approved, reject when not already rejected. */}
          {review.status !== "approved" && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={busy}
              onClick={() => onRequestAction("approve")}
              aria-label="Approve review"
            >
              {is("approve") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          )}
          {review.status !== "rejected" && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              disabled={busy}
              onClick={() => onRequestAction("reject")}
              aria-label="Reject review"
            >
              {is("reject") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            disabled={busy}
            onClick={() => onRequestAction("delete")}
            aria-label="Delete review"
          >
            {is("delete") ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

function ReviewMobileCard({
  review,
  selected,
  actionKey,
  onToggleSelect,
  onView,
  onRequestAction,
}: {
  review: AdminReview;
  selected: boolean;
  actionKey: string | null;
  onToggleSelect: (checked: boolean) => void;
  onView: () => void;
  onRequestAction: (action: ReviewAction) => void;
}) {
  const busy = actionKey?.startsWith(`${review.id}:`) ?? false;
  const is = (action: ReviewAction) => actionKey === `${review.id}:${action}`;

  return (
    <article className="rounded-lg border border-border bg-white p-4">
      <div className="flex items-start gap-3">
        <Checkbox
          className="mt-1"
          checked={selected}
          onCheckedChange={(checked) => onToggleSelect(checked === true)}
          aria-label={`Select review by ${review.authorName}`}
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p
              className="min-w-0 truncate text-sm font-medium text-foreground"
              title={review.dealer.name}
            >
              {review.dealer.name}
            </p>
            <StatusBadge status={review.status} />
          </div>
          <p
            className="mt-1 truncate text-sm text-muted-foreground"
            title={review.authorName}
          >
            {review.authorName} · {review.overallRating} ·{" "}
            {format(new Date(review.createdAt), "MMM d, yyyy")}
          </p>
          <button
            type="button"
            title={review.title}
            className="mt-2 block w-full min-w-0 truncate text-left text-sm font-medium text-foreground hover:underline"
            onClick={onView}
          >
            {review.title}
          </button>
          <div className="mt-3 flex items-center gap-0.5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground"
              onClick={onView}
              aria-label="View review"
            >
              <Eye className="h-4 w-4" />
            </Button>
            {review.status !== "approved" && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                disabled={busy}
                onClick={() => onRequestAction("approve")}
                aria-label="Approve review"
              >
                {is("approve") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </Button>
            )}
            {review.status !== "rejected" && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground"
                disabled={busy}
                onClick={() => onRequestAction("reject")}
                aria-label="Reject review"
              >
                {is("reject") ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={busy}
              onClick={() => onRequestAction("delete")}
              aria-label="Delete review"
            >
              {is("delete") ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}

function ReviewDetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="break-all font-medium text-foreground">{value}</p>
    </div>
  );
}

function ReviewDetailDialog({
  review,
  onClose,
}: {
  review: AdminReview | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(review)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pr-6">
          <DialogTitle>{review?.title}</DialogTitle>
          <DialogDescription>
            {review && `${review.authorName} · ${review.dealer.name}`}
          </DialogDescription>
        </DialogHeader>
        {review && (
          <div className="min-w-0 max-h-[60vh] space-y-4 overflow-y-auto overflow-x-hidden text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={review.status} />
              <span className="font-medium text-foreground">
                {review.overallRating}★ overall
              </span>
              <span className="text-muted-foreground">
                {format(new Date(review.createdAt), "MMM d, yyyy")}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <ThumbsUp className="h-3.5 w-3.5" />
                {review.helpfulCount}
              </span>
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <ThumbsDown className="h-3.5 w-3.5" />
                {review.notHelpfulCount}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 p-3">
              <ReviewDetailField label="Author" value={review.authorName} />
              <ReviewDetailField label="Email" value={review.email} />
              <ReviewDetailField label="Dealer" value={review.dealer.name} />
              <ReviewDetailField
                label="Visit Type"
                value={review.visitType ?? "—"}
              />
              <ReviewDetailField
                label="Recommend"
                value={
                  review.recommend === null
                    ? "—"
                    : review.recommend
                      ? "Yes"
                      : "No"
                }
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Category ratings
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <ReviewDetailField
                  label="Service"
                  value={
                    review.customerServiceRating
                      ? `${review.customerServiceRating}★`
                      : "—"
                  }
                />
                <ReviewDetailField
                  label="Quality"
                  value={
                    review.qualityRating ? `${review.qualityRating}★` : "—"
                  }
                />
                <ReviewDetailField
                  label="Friendliness"
                  value={
                    review.friendlinessRating
                      ? `${review.friendlinessRating}★`
                      : "—"
                  }
                />
                <ReviewDetailField
                  label="Pricing"
                  value={
                    review.pricingRating ? `${review.pricingRating}★` : "—"
                  }
                />
              </div>
            </div>

            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Comment
              </p>
              <p className="whitespace-pre-wrap break-all leading-relaxed text-foreground">
                {review.comment}
              </p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewsSection() {
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  const [dealerId, setDealerId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<AdminReview | null>(null);
  const [dealerOptions, setDealerOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [data, setData] = useState<{
    reviews: AdminReview[];
    total: number;
    page: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<ReviewAction | null>(null);
  const [searching, setSearching] = useState(false);
  const [confirm, setConfirm] = useState<{
    mode: "single" | "bulk";
    action: "reject" | "delete";
    reviewId?: string;
    reviewTitle?: string;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof adminApi.dashboard>
  > | null>(null);

  const ratingFilter = rating !== "all" ? Number(rating) : undefined;
  const dealerFilter = dealerId !== "all" ? dealerId : undefined;

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await adminApi.reviews({
        status,
        search,
        dealerId: dealerFilter,
        rating: ratingFilter,
        page,
      });
      setData(result);
      setSelected(new Set());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [status, search, dealerFilter, ratingFilter, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminApi.dashboard());
    } catch {
      // Stat cards are a nice-to-have; ignore failures silently.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void adminApi
      .dealersSelect()
      .then((dealers) =>
        setDealerOptions(dealers.map((d) => ({ id: d.id, name: d.name })))
      )
      .catch(() => {
        /* dropdown stays empty; search still works */
      });
  }, []);

  async function runSearch() {
    setSearching(true);
    setPage(1);
    try {
      setLoading(true);
      setMessage(null);
      const result = await adminApi.reviews({
        status,
        search,
        dealerId: dealerFilter,
        rating: ratingFilter,
        page: 1,
      });
      setData(result);
      setSelected(new Set());
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load reviews");
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  async function runSingle(id: string, action: ReviewAction) {
    setActionKey(`${id}:${action}`);
    try {
      await adminApi.reviewAction(id, action);
      setMessage(`Review ${action}d`);
      await load();
      void loadStats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Action failed");
    } finally {
      setActionKey(null);
    }
  }

  async function runBulk(action: ReviewAction) {
    if (selected.size === 0) return;
    setBulkAction(action);
    try {
      await adminApi.bulkReviews(Array.from(selected), action);
      setMessage(`Bulk ${action} complete`);
      await load();
      void loadStats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBulkAction(null);
    }
  }

  function requestSingle(review: AdminReview, action: ReviewAction) {
    if (action === "approve") {
      void runSingle(review.id, action);
      return;
    }
    setConfirm({
      mode: "single",
      action,
      reviewId: review.id,
      reviewTitle: review.title,
    });
  }

  function requestBulk(action: ReviewAction) {
    if (selected.size === 0) return;
    if (action === "approve") {
      void runBulk(action);
      return;
    }
    setConfirm({ mode: "bulk", action });
  }

  async function handleConfirm() {
    if (!confirm) return;
    setConfirming(true);
    try {
      if (confirm.mode === "single" && confirm.reviewId) {
        await runSingle(confirm.reviewId, confirm.action);
      } else {
        await runBulk(confirm.action);
      }
      setConfirm(null);
    } finally {
      setConfirming(false);
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  const busy = Boolean(actionKey || bulkAction || confirming);

  return (
    <div className="space-y-4">
      {!stats ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Total Reviews"
            value={stats.reviews.total}
            icon={Star}
            tone="primary"
            active={status === "all"}
            onClick={() => {
              setStatus("all");
              setPage(1);
            }}
          />
          <StatCard
            label="Pending"
            value={stats.reviews.pending}
            icon={Clock}
            tone="warning"
            urgent={stats.pendingUrgent}
            active={status === "pending"}
            onClick={() => {
              setStatus("pending");
              setPage(1);
            }}
          />
          <StatCard
            label="Approved"
            value={stats.reviews.approved}
            icon={Check}
            tone="success"
            active={status === "approved"}
            onClick={() => {
              setStatus("approved");
              setPage(1);
            }}
          />
          <StatCard
            label="Rejected"
            value={stats.reviews.rejected}
            icon={X}
            tone="destructive"
            active={status === "rejected"}
            onClick={() => {
              setStatus("rejected");
              setPage(1);
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-semibold">Status</label>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:min-w-[14rem] sm:flex-1 sm:max-w-xs">
          <label className="mb-1 block text-xs font-semibold">Dealer</label>
          <AdminSearchableSelect
            value={dealerId}
            onValueChange={(v) => {
              setDealerId(v);
              setPage(1);
            }}
            options={dealerOptions.map((d) => ({
              value: d.id,
              label: d.name,
            }))}
            allOption={{ value: "all", label: "All dealers" }}
            placeholder="All dealers"
            searchPlaceholder="Search dealers…"
            emptyLabel="No dealers match"
          />
        </div>
        <div className="w-full sm:w-36">
          <label className="mb-1 block text-xs font-semibold">Rating</label>
          <Select value={rating} onValueChange={(v) => { setRating(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ratings</SelectItem>
              <SelectItem value="5">5 ★</SelectItem>
              <SelectItem value="4">4 ★</SelectItem>
              <SelectItem value="3">3 ★</SelectItem>
              <SelectItem value="2">2 ★</SelectItem>
              <SelectItem value="1">1 ★</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold">Search</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
            placeholder="Author or title"
          />
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={searching || loading}
          onClick={() => void runSearch()}
        >
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </>
          ) : (
            "Search"
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <Button
          type="button"
          size="sm"
          className="w-full sm:w-auto"
          disabled={busy || selected.size === 0}
          onClick={() => requestBulk("approve")}
        >
          {bulkAction === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Approve selected
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={busy || selected.size === 0}
          onClick={() => requestBulk("reject")}
        >
          {bulkAction === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <X className="h-4 w-4" />
          )}
          Reject selected
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full sm:w-auto text-destructive hover:bg-destructive/5 hover:text-destructive"
          disabled={busy || selected.size === 0}
          onClick={() => requestBulk("delete")}
        >
          {bulkAction === "delete" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Delete selected
        </Button>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : !data ? (
        <AdminLoadingState label="Unable to load reviews" />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Checkbox
                checked={
                  data.reviews.length > 0 &&
                  data.reviews.every((r) => selected.has(r.id))
                }
                onCheckedChange={(checked) => {
                  setSelected(
                    checked === true
                      ? new Set(data.reviews.map((r) => r.id))
                      : new Set()
                  );
                }}
              />
              Select all on this page
            </label>
            {data.reviews.map((review) => (
              <ReviewMobileCard
                key={review.id}
                review={review}
                selected={selected.has(review.id)}
                actionKey={actionKey}
                onToggleSelect={(checked) => {
                  const next = new Set(selected);
                  if (checked) next.add(review.id);
                  else next.delete(review.id);
                  setSelected(next);
                }}
                onView={() => setViewing(review)}
                onRequestAction={(action) => requestSingle(review, action)}
              />
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border border-border/70 bg-white md:block">
            <table className="w-full min-w-[720px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-10" />
                <col className="w-[18%]" />
                <col className="w-[12%]" />
                <col className="w-16" />
                <col />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-28" />
              </colgroup>
              <thead className="border-b bg-slate-50 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={
                        data.reviews.length > 0 &&
                        data.reviews.every((r) => selected.has(r.id))
                      }
                      onCheckedChange={(checked) => {
                        setSelected(
                          checked === true
                            ? new Set(data.reviews.map((r) => r.id))
                            : new Set()
                        );
                      }}
                    />
                  </th>
                  <th className="px-3 py-2.5">Dealer</th>
                  <th className="p-3">Author</th>
                  <th className="p-3">Rating</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.reviews.map((review) => (
                  <ReviewRow
                    key={review.id}
                    review={review}
                    selected={selected.has(review.id)}
                    actionKey={actionKey}
                    onToggleSelect={(checked) => {
                      const next = new Set(selected);
                      if (checked) next.add(review.id);
                      else next.delete(review.id);
                      setSelected(next);
                    }}
                    onView={() => setViewing(review)}
                    onRequestAction={(action) => requestSingle(review, action)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

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

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={
          confirm?.action === "delete"
            ? confirm.mode === "bulk"
              ? "Delete selected reviews?"
              : "Delete this review?"
            : confirm?.mode === "bulk"
              ? "Reject selected reviews?"
              : "Reject this review?"
        }
        description={
          confirm?.mode === "bulk"
            ? `This will ${confirm.action} ${selected.size} selected review${selected.size === 1 ? "" : "s"}. This cannot be undone for deletes.`
            : confirm?.action === "delete"
              ? `Delete “${confirm.reviewTitle ?? "this review"}”? This cannot be undone.`
              : `Reject “${confirm?.reviewTitle ?? "this review"}”? It will no longer be eligible to appear publicly.`
        }
        confirmLabel={confirm?.action === "delete" ? "Delete" : "Reject"}
        confirming={confirming}
        destructive={confirm?.action === "delete"}
        onConfirm={() => void handleConfirm()}
      />

      <ReviewDetailDialog review={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function emptyDealerForm() {
  return {
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
    email: "",
    website: "",
    description: "",
    featured: false,
    googleRating: "" as string | number,
    googleReviewCount: "" as string | number,
    yelpRating: "" as string | number,
    yelpReviewCount: "" as string | number,
    carfaxRating: "" as string | number,
    carfaxUrl: "",
    autoSalesReviewsRating: "" as string | number,
    useManualRating: false,
    manualRatingOverride: "" as string | number,
    hasBadge: false,
    badgeYear: new Date().getFullYear() as string | number,
    googlePlaceId: "",
    yelpBusinessId: "",
    autoDevDealerId: "",
  };
}

function formFromDealer(dealer: AdminDealer) {
  return {
    name: dealer.name,
    address: dealer.address ?? "",
    city: dealer.city,
    state: dealer.state,
    zip: dealer.zip,
    phone: dealer.phone ?? "",
    email: dealer.email ?? "",
    website: dealer.website ?? "",
    description: dealer.description ?? "",
    featured: dealer.featured,
    googleRating: dealer.googleRating ?? "",
    googleReviewCount: dealer.googleReviewCount ?? "",
    yelpRating: dealer.yelpRating ?? "",
    yelpReviewCount: dealer.yelpReviewCount ?? "",
    carfaxRating: dealer.carfaxRating ?? "",
    carfaxUrl: dealer.carfaxUrl ?? "",
    autoSalesReviewsRating: dealer.autoSalesReviewsRating ?? "",
    useManualRating: dealer.useManualRating,
    manualRatingOverride: dealer.manualRatingOverride ?? "",
    hasBadge: dealer.hasBadge,
    badgeYear: dealer.badgeYear ?? new Date().getFullYear(),
    googlePlaceId: dealer.googlePlaceId ?? "",
    yelpBusinessId: dealer.yelpBusinessId ?? "",
    autoDevDealerId: dealer.autoDevDealerId ?? "",
  };
}

function dealerPayload(form: ReturnType<typeof emptyDealerForm>) {
  return {
    name: form.name.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim().toUpperCase(),
    zip: form.zip.trim(),
    phone: form.phone || null,
    email: form.email || null,
    website: form.website || null,
    description: form.description || null,
    featured: form.featured,
    // googleRating / googleReviewCount are server-derived from googlePlaceId
    // on save — never sent from the client. Same for yelpRating /
    // yelpReviewCount, derived from yelpBusinessId.
    carfaxRating: numOrNull(form.carfaxRating),
    carfaxUrl: form.carfaxUrl || null,
    autoSalesReviewsRating: numOrNull(form.autoSalesReviewsRating),
    useManualRating: form.useManualRating,
    manualRatingOverride: numOrNull(form.manualRatingOverride),
    hasBadge: form.hasBadge,
    badgeYear: form.hasBadge ? Number(form.badgeYear) : null,
    googlePlaceId: form.googlePlaceId || null,
    yelpBusinessId: form.yelpBusinessId || null,
    autoDevDealerId: form.autoDevDealerId || null,
  };
}

function DealerFormModal({
  dealer,
  onClose,
  onSaved,
}: {
  dealer: AdminDealer | null;
  onClose: () => void;
  onSaved: (mode: "create" | "edit") => void;
}) {
  const isCreate = dealer === null;
  const [form, setForm] = useState(() =>
    dealer ? formFromDealer(dealer) : emptyDealerForm()
  );
  const [settings, setSettings] = useState<RatingSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    adminApi.ratingSettings().then(setSettings).catch(() => undefined);
  }, []);

  const preview = useMemo(() => {
    if (!settings) return null;
    return calculateCombinedPreview(
      {
        googleRating: numOrNull(form.googleRating),
        yelpRating: numOrNull(form.yelpRating),
        carfaxRating: numOrNull(form.carfaxRating),
        autoSalesReviewsRating: numOrNull(form.autoSalesReviewsRating),
        platformRating: dealer?.platformRating ?? null,
        useManualRating: form.useManualRating,
        manualRatingOverride: numOrNull(form.manualRatingOverride),
        googleReviewCount: intOrNull(form.googleReviewCount),
        yelpReviewCount: intOrNull(form.yelpReviewCount),
        platformReviewCount: dealer?.platformReviewCount ?? 0,
      },
      settings
    );
  }, [
    form,
    settings,
    dealer?.platformRating,
    dealer?.platformReviewCount,
  ]);

  async function save() {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.state || !form.zip.trim()) {
      setMessage("Name, address, city, state, and ZIP are required.");
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const payload = dealerPayload(form);
      if (isCreate) {
        await adminApi.createDealer(payload);
      } else if (dealer) {
        await adminApi.updateDealer(dealer.id, payload);
      }
      onSaved(isCreate ? "create" : "edit");
      onClose();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <DialogContent
        showClose={!saving}
        className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <DialogHeader className="shrink-0 border-b border-border/70 px-5 py-4 pr-12">
          <DialogTitle>
            {isCreate ? "Add new dealer" : `Edit ${dealer.name}`}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create a dealer profile with location, ratings, and badge settings."
              : "Update dealer profile, ratings, and badge settings."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
            <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <div>
              <label className="mb-1 block text-xs font-semibold">State</label>
              <AdminSearchableSelect
                value={form.state}
                onValueChange={(v) => setForm({ ...form, state: v })}
                options={STATES.map((s) => ({
                  value: s.code,
                  label: `${s.code} — ${s.label}`,
                }))}
                placeholder="Select state"
                searchPlaceholder="Search states…"
                emptyLabel="No states match"
              />
            </div>
            <Field label="ZIP" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} />
            <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} className="sm:col-span-2" />
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <Checkbox
                checked={form.featured}
                onCheckedChange={(checked) =>
                  setForm({ ...form, featured: checked === true })
                }
              />
              Featured dealer
            </label>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold">Description</label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-input px-3 py-2 text-sm"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="sm:col-span-2">
              <Field label="Google Place ID" value={String(form.googlePlaceId)} onChange={(v) => setForm({ ...form, googlePlaceId: v })} />
              <p className="mt-1 text-xs text-muted-foreground">
                Saving verifies the ID against Google Places and pulls the current rating automatically. Leave blank to skip Google.
              </p>
            </div>
            <Field label="Auto.dev dealer ID" value={String(form.autoDevDealerId)} onChange={(v) => setForm({ ...form, autoDevDealerId: v })} className="sm:col-span-2" />
            <div>
              <label className="mb-1 block text-xs font-semibold">Google Rating</label>
              <p className="flex h-9 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                {form.googleRating ? `★ ${form.googleRating} (${form.googleReviewCount || 0} reviews)` : "Not synced yet"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">&nbsp;</label>
              <p className="flex h-9 items-center text-xs text-muted-foreground">
                Synced automatically — not editable here.
              </p>
            </div>
            <div className="sm:col-span-2">
              <Field label="Yelp Business ID" value={String(form.yelpBusinessId)} onChange={(v) => setForm({ ...form, yelpBusinessId: v })} />
              <p className="mt-1 text-xs text-muted-foreground">
                Saving verifies the ID against Yelp and pulls the current rating automatically. Shown as its own badge, not blended into Combined — Yelp&apos;s API terms forbid averaging its rating with other sources. Leave blank to skip Yelp.
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">Yelp Rating</label>
              <p className="flex h-9 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                {form.yelpRating ? `★ ${form.yelpRating} (${form.yelpReviewCount || 0} reviews)` : "Not synced yet"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">&nbsp;</label>
              <p className="flex h-9 items-center text-xs text-muted-foreground">
                Synced automatically — not editable here.
              </p>
            </div>
            <Field label="Carfax Rating" type="number" step="0.1" value={String(form.carfaxRating)} onChange={(v) => setForm({ ...form, carfaxRating: v })} />
            <Field label="Carfax URL" value={form.carfaxUrl} onChange={(v) => setForm({ ...form, carfaxUrl: v })} />
            <Field label="AutoSalesReviews Rating" type="number" step="0.1" value={String(form.autoSalesReviewsRating)} onChange={(v) => setForm({ ...form, autoSalesReviewsRating: v })} />

            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <Checkbox
                checked={form.useManualRating}
                onCheckedChange={(checked) =>
                  setForm({ ...form, useManualRating: checked === true })
                }
              />
              Use manual rating override
            </label>
            {form.useManualRating && (
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1">
                  <Field
                    label="Manual Rating Override"
                    type="number"
                    step="0.1"
                    value={String(form.manualRatingOverride)}
                    onChange={(v) =>
                      setForm({ ...form, manualRatingOverride: v })
                    }
                  />
                </div>
                <label className="flex h-10 shrink-0 items-center gap-2 text-sm font-semibold">
                  <Checkbox
                    checked={form.hasBadge}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, hasBadge: checked === true })
                    }
                  />
                  Assign excellence badge
                </label>
              </div>
            )}
            {!form.useManualRating && (
              <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
                <Checkbox
                  checked={form.hasBadge}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, hasBadge: checked === true })
                  }
                />
                Assign excellence badge
              </label>
            )}
            {form.hasBadge && (
              <Field
                label="Badge Year"
                type="number"
                value={String(form.badgeYear)}
                onChange={(v) => setForm({ ...form, badgeYear: Number(v) })}
              />
            )}
          </div>

          <div className="mt-4 rounded-lg bg-secondary/60 p-4">
            <p className="text-sm font-semibold text-muted-foreground">
              Live combined rating preview
            </p>
            <p className="mt-1 text-3xl font-semibold text-primary">
              {preview?.combinedRating != null
                ? preview.combinedRating.toFixed(1)
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              Platform rating (approved reviews):{" "}
              {dealer?.platformRating?.toFixed(1) ?? "—"} (
              {dealer?.platformReviewCount ?? 0})
            </p>
          </div>

          {message && (
            <p className="mt-3 text-sm text-destructive">{message}</p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-border/70 px-5 py-4">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {isCreate ? "Creating…" : "Saving…"}
              </>
            ) : isCreate ? (
              "Create dealer"
            ) : (
              "Save changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold">{label}</label>
      <Input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function numOrNull(v: string | number): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function intOrNull(v: string | number): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

function DealerDetailDialog({
  dealer,
  onClose,
}: {
  dealer: AdminDealer | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(dealer)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{dealer?.name}</DialogTitle>
          <DialogDescription>
            {dealer &&
              [dealer.address, `${dealer.city}, ${dealer.state} ${dealer.zip}`]
                .filter(Boolean)
                .join(", ")}
          </DialogDescription>
        </DialogHeader>
        {dealer && (
          <div className="max-h-[60vh] space-y-4 overflow-y-auto text-sm">
            <div className="flex flex-wrap items-center gap-2">
              {dealer.featured && (
                <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold uppercase text-gold-800">
                  Featured
                </span>
              )}
              {dealer.hasBadge && (
                <span className="rounded-md bg-accent/20 px-2 py-0.5 text-xs font-bold uppercase text-gold-800">
                  Badged {dealer.badgeYear}
                </span>
              )}
              <span className="font-medium text-foreground">
                {dealer.combinedRating != null
                  ? `${dealer.combinedRating.toFixed(1)}★ combined`
                  : "No combined rating"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 p-3">
              <ReviewDetailField label="Phone" value={dealer.phone ?? "—"} />
              <ReviewDetailField label="Email" value={dealer.email ?? "—"} />
              <ReviewDetailField label="Website" value={dealer.website ?? "—"} />
              <ReviewDetailField
                label="Platform Reviews"
                value={`${dealer.platformReviewCount} (${dealer.platformRating?.toFixed(1) ?? "—"}★)`}
              />
            </div>

            {dealer.description && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="break-words leading-relaxed text-foreground">{dealer.description}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Rating sources
              </p>
              <div className="space-y-1.5">
                {dealer.ratingSources.map((source) => (
                  <div
                    key={source.key}
                    className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2"
                  >
                    <span className="font-medium text-foreground">
                      {source.label}
                      {!source.included && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (excluded)
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium text-foreground">
                      {source.rating != null ? `${source.rating.toFixed(1)}★` : "—"}
                      {source.reviewCount != null && (
                        <span className="ml-1 font-normal text-muted-foreground">
                          ({source.reviewCount})
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {dealer.useManualRating && (
              <p className="text-xs text-muted-foreground">
                Manual override active: {dealer.manualRatingOverride?.toFixed(1) ?? "—"}★
              </p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DealersSection() {
  const [search, setSearch] = useState("");
  const [featured, setFeatured] = useState("all");
  const [hasBadge, setHasBadge] = useState("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    dealers: AdminDealer[];
    total: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState<AdminDealer | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<AdminDealer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminDealer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof adminApi.dashboard>
  > | null>(null);

  const featuredFilter = featured !== "all" ? featured === "true" : undefined;
  const hasBadgeFilter = hasBadge !== "all" ? hasBadge === "true" : undefined;

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminApi.dashboard());
    } catch {
      // ignore
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(
        await adminApi.dealers({
          search,
          featured: featuredFilter,
          hasBadge: hasBadgeFilter,
          page,
        })
      );
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [search, featuredFilter, hasBadgeFilter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function runSearch() {
    setSearching(true);
    setPage(1);
    try {
      setLoading(true);
      setData(
        await adminApi.dealers({
          search,
          featured: featuredFilter,
          hasBadge: hasBadgeFilter,
          page: 1,
        })
      );
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminApi.deleteDealer(deleteTarget.id);
      setMessage(`Deleted “${deleteTarget.name}”.`);
      setDeleteTarget(null);
      await load();
      void loadStats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  return (
    <div className="space-y-4">
      {!stats ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Total Dealers"
            value={stats.dealers}
            icon={Store}
            tone="primary"
            active={featured === "all" && hasBadge === "all"}
            onClick={() => {
              setFeatured("all");
              setHasBadge("all");
              setPage(1);
            }}
          />
          <StatCard
            label="Featured"
            value={stats.dealersFeatured}
            icon={Star}
            tone="accent"
            active={featured === "true"}
            onClick={() => {
              setFeatured("true");
              setPage(1);
            }}
          />
          <StatCard
            label="Badged"
            value={stats.dealersBadged}
            icon={Shield}
            tone="accent"
            active={hasBadge === "true"}
            onClick={() => {
              setHasBadge("true");
              setPage(1);
            }}
          />
          <StatCard
            label="No Badge"
            value={stats.dealers - stats.dealersBadged}
            icon={Store}
            tone="primary"
            active={hasBadge === "false"}
            onClick={() => {
              setHasBadge("false");
              setPage(1);
            }}
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold">Search</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers"
            onKeyDown={(e) => e.key === "Enter" && void runSearch()}
          />
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-semibold">Featured</label>
          <Select
            value={featured}
            onValueChange={(v) => {
              setFeatured(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dealers</SelectItem>
              <SelectItem value="true">Featured only</SelectItem>
              <SelectItem value="false">Not featured</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-semibold">Badge</label>
          <Select
            value={hasBadge}
            onValueChange={(v) => {
              setHasBadge(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dealers</SelectItem>
              <SelectItem value="true">Has badge</SelectItem>
              <SelectItem value="false">No badge</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          className="w-full shrink-0 sm:w-auto"
          disabled={searching || loading}
          onClick={() => void runSearch()}
        >
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </>
          ) : (
            "Search"
          )}
        </Button>
        <Button
          type="button"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add new dealer
        </Button>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : !data ? (
        <AdminLoadingState label="Unable to load dealers" />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {data.dealers.map((d) => (
              <article
                key={d.id}
                className="rounded-lg border border-border/70 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{d.name}</p>
                      <Badge
                        variant={d.featured ? "goldSoft" : "neutral"}
                        className="font-medium"
                      >
                        {d.featured ? "Featured" : "Not featured"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {d.city}, {d.state}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className="font-medium text-foreground">
                        {d.combinedRating?.toFixed(1) ?? "—"}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        · Badge: {d.hasBadge ? `Yes (${d.badgeYear})` : "No"}
                      </span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => setViewing(d)}
                      aria-label={`View ${d.name}`}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => {
                        setCreating(false);
                        setEditing(d);
                      }}
                      aria-label={`Edit ${d.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(d)}
                      aria-label={`Delete ${d.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-lg border bg-white md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b bg-slate-50 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-3 py-2.5">Name</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Combined</th>
                  <th className="px-3 py-2.5">Featured</th>
                  <th className="px-3 py-2.5">Badge</th>
                  <th className="px-3 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.dealers.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-slate-50/80">
                    <td className="px-3 py-2.5 text-sm font-medium">{d.name}</td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">
                      {d.city}, {d.state}
                    </td>
                    <td className="px-3 py-2.5 text-sm tabular-nums text-foreground">
                      {d.combinedRating?.toFixed(1) ?? "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      {d.featured ? (
                        <Badge variant="goldSoft" className="font-medium">
                          Featured
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="font-medium">
                          Not featured
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-muted-foreground">
                      {d.hasBadge ? `Yes (${d.badgeYear})` : "No"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => setViewing(d)}
                          aria-label={`View ${d.name}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => {
                            setCreating(false);
                            setEditing(d);
                          }}
                          aria-label={`Edit ${d.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteTarget(d)}
                          aria-label={`Delete ${d.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-center text-sm text-muted-foreground sm:text-left">
          Page {page} / {totalPages}
        </span>
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

      {(creating || editing) && (
        <DealerFormModal
          dealer={creating ? null : editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={(mode) => {
            setMessage(
              mode === "create"
                ? "Dealer created successfully."
                : "Dealer saved successfully."
            );
            void load();
            void loadStats();
          }}
        />
      )}

      <DealerDetailDialog dealer={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete this dealer?"
        description={
          deleteTarget
            ? `Delete “${deleteTarget.name}”? All reviews for this dealer will also be removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete dealer"
        confirming={deleting}
        destructive
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}

function RatingsSection() {
  const [settings, setSettings] = useState<RatingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    adminApi
      .ratingSettings()
      .then(setSettings)
      .catch((e) => setMessage(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggle(
    key:
      | "googleEnabled"
      | "yelpEnabled"
      | "carfaxEnabled"
      | "autoSalesReviewsEnabled"
      | "platformEnabled",
    value: boolean
  ) {
    if (!settings) return;
    setSavingKey(key);
    try {
      const result = await adminApi.updateRatingSettings({ [key]: value });
      setSettings(result.settings);
      setMessage("Rating sources updated. Combined ratings recalculated.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return <RatingsSkeleton />;
  }

  if (!settings) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-semibold text-destructive">
          {message || "Unable to load rating settings"}
        </p>
      </div>
    );
  }

  const toggles: {
    key:
      | "googleEnabled"
      | "yelpEnabled"
      | "carfaxEnabled"
      | "autoSalesReviewsEnabled"
      | "platformEnabled";
    label: string;
    description?: string;
  }[] = [
    { key: "googleEnabled", label: "Google Reviews" },
    {
      key: "yelpEnabled",
      label: "Yelp Reviews",
      description:
        "Shown as its own standalone badge — Yelp's API terms forbid averaging its rating into Combined.",
    },
    { key: "carfaxEnabled", label: "Carfax" },
    { key: "autoSalesReviewsEnabled", label: "AutoSalesReviews Rating" },
    { key: "platformEnabled", label: "Platform Reviews" },
  ];

  const enabledCount = toggles.filter((t) => Boolean(settings[t.key])).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Total Sources"
          value={toggles.length}
          icon={Settings2}
          tone="primary"
        />
        <StatCard
          label="Enabled"
          value={enabledCount}
          icon={Check}
          tone="success"
        />
        <StatCard
          label="Disabled"
          value={toggles.length - enabledCount}
          icon={X}
          tone="destructive"
        />
        <StatCard
          label="Last Updated"
          value={format(new Date(settings.updatedAt), "MMM d, yyyy")}
          icon={Clock}
          tone="primary"
        />
      </div>

      <div className="space-y-4 rounded-lg border bg-white p-5">
        <p className="text-sm text-muted-foreground">
          Toggle which sources are included in combined ratings across all dealers.
        </p>
        <div className="space-y-3">
          {toggles.map((t) => {
            const isSaving = savingKey === t.key;
            return (
              <label
                key={t.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border/70 px-4 py-3"
              >
                <span>
                  <span className="block font-semibold text-foreground">{t.label}</span>
                  {t.description && (
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {t.description}
                    </span>
                  )}
                </span>
                <span className="inline-flex shrink-0 items-center gap-2">
                  {isSaving && (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  )}
                  <Switch
                    disabled={Boolean(savingKey)}
                    checked={Boolean(settings[t.key])}
                    onCheckedChange={(checked) => void toggle(t.key, checked)}
                  />
                </span>
              </label>
            );
          })}
        </div>
        {savingKey && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            Updating and recalculating ratings…
          </p>
        )}
        {message && <p className="text-sm text-muted-foreground">{message}</p>}
      </div>
    </div>
  );
}

function BadgesSection() {
  const [badged, setBadged] = useState<AdminDealer[]>([]);
  const [options, setOptions] = useState<
    { id: string; name: string; slug: string; hasBadge: boolean; badgeYear: number | null }[]
  >([]);
  const [dealerId, setDealerId] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AdminDealer | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [b, o] = await Promise.all([
        adminApi.badgedDealers(),
        adminApi.dealersSelect(),
      ]);
      setBadged(b);
      setOptions(o);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load badges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function assign() {
    if (!dealerId) return;
    setAssigning(true);
    setMessage(null);
    try {
      await adminApi.assignBadge(dealerId, Number(year));
      setMessage("Badge assigned");
      setDealerId("");
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Assign failed");
    } finally {
      setAssigning(false);
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await adminApi.revokeBadge(revokeTarget.id);
      setMessage("Badge revoked");
      setRevokeTarget(null);
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Revoke failed");
    } finally {
      setRevoking(false);
    }
  }

  function embedCode(slug: string) {
    return `<script src="${env.siteUrl}/api/badge/${slug}/widget.js"></script>`;
  }

  if (loading && badged.length === 0 && options.length === 0) {
    return <BadgesSkeleton />;
  }

  const currentYear = new Date().getFullYear();
  const badgesThisYear = badged.filter((d) => d.badgeYear === currentYear).length;
  const eligibleDealers = Math.max(0, options.length - badged.length);
  const availableYears = Array.from(
    new Set(badged.map((d) => d.badgeYear).filter((y): y is number => y != null))
  ).sort((a, b) => b - a);
  const filteredBadged =
    yearFilter === "all"
      ? badged
      : badged.filter((d) => String(d.badgeYear) === yearFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <StatCard
          label="Badges Assigned"
          value={badged.length}
          icon={Shield}
          tone="accent"
          active={yearFilter === "all"}
          onClick={() => setYearFilter("all")}
        />
        <StatCard
          label={`Assigned in ${currentYear}`}
          value={badgesThisYear}
          icon={Calendar}
          tone="primary"
          active={yearFilter === String(currentYear)}
          onClick={() => setYearFilter(String(currentYear))}
        />
        <StatCard
          label="Eligible Dealers"
          value={eligibleDealers}
          icon={Store}
          tone="primary"
        />
        <StatCard
          label="Total Dealers"
          value={options.length}
          icon={Store}
          tone="primary"
        />
      </div>

      <div className="rounded-lg border bg-white p-4 sm:p-5">
        <h3 className="mb-3 font-medium text-foreground">Assign badge</h3>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <AdminSearchableSelect
            value={dealerId || ""}
            onValueChange={setDealerId}
            options={options.map((o) => ({ value: o.id, label: o.name }))}
            placeholder="Select dealer"
            searchPlaceholder="Search dealers…"
            emptyLabel="No dealers match"
            className="sm:w-64"
          />
          <Input
            className="w-full sm:w-28"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={assigning || loading || !dealerId}
            onClick={() => void assign()}
          >
            {assigning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Assigning…
              </>
            ) : (
              "Assign"
            )}
          </Button>
        </div>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {badged.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-foreground">Assigned badges</h3>
          <div className="w-36">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="h-9 w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <AdminLoadingState label="Refreshing badge list…" className="min-h-[160px]" />
      ) : (
        <div className="space-y-3">
          {filteredBadged.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {badged.length === 0
                ? "No badges assigned yet."
                : "No badges assigned for this year."}
            </p>
          ) : (
            filteredBadged.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{d.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Excellence Award {d.badgeYear} · Combined{" "}
                      {d.combinedRating?.toFixed(1) ?? "—"}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
                    <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                      <a href={`/badge/${d.slug}`} target="_blank" rel="noreferrer">
                        Preview
                      </a>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={async () => {
                        await navigator.clipboard.writeText(embedCode(d.slug));
                        setCopied(d.slug);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      {copied === d.slug ? "Copied" : "Copy"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto text-destructive hover:bg-destructive/5 hover:text-destructive"
                      disabled={revoking}
                      onClick={() => setRevokeTarget(d)}
                    >
                      Revoke
                    </Button>
                  </div>
                </div>
                <code className="mt-3 block overflow-x-auto rounded-md bg-slate-50 p-2 text-xs">
                  {embedCode(d.slug)}
                </code>
              </div>
            ))
          )}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        onOpenChange={(open) => {
          if (!open) setRevokeTarget(null);
        }}
        title="Revoke excellence badge?"
        description={
          revokeTarget
            ? `Remove the ${revokeTarget.badgeYear ?? ""} excellence badge from ${revokeTarget.name}?`
            : ""
        }
        confirmLabel="Revoke badge"
        confirming={revoking}
        destructive
        onConfirm={() => void confirmRevoke()}
      />
    </div>
  );
}

function ReportsSection() {
  const [status, setStatus] = useState("open");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{
    reports: AdminReport[];
    total: number;
    pageSize: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [viewing, setViewing] = useState<AdminReport | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminReport | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [stats, setStats] = useState<Awaited<
    ReturnType<typeof adminApi.dashboard>
  > | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await adminApi.reports({ status, search, page }));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load reports");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [status, search, page]);

  const loadStats = useCallback(async () => {
    try {
      setStats(await adminApi.dashboard());
    } catch {
      // Stat cards are a nice-to-have; ignore failures silently.
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  async function runSearch() {
    setSearching(true);
    setPage(1);
    try {
      setLoading(true);
      setData(await adminApi.reports({ status, search, page: 1 }));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to load reports");
      setData(null);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }

  async function resolve(report: AdminReport) {
    setActionKey(`${report.id}:resolve`);
    try {
      await adminApi.resolveReport(report.id);
      setMessage("Report marked as resolved.");
      await load();
      void loadStats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to resolve report");
    } finally {
      setActionKey(null);
    }
  }

  async function deleteReview() {
    if (!confirmDelete) return;
    setConfirming(true);
    try {
      await adminApi.reviewAction(confirmDelete.review.id, "delete");
      await adminApi.resolveReport(confirmDelete.id).catch(() => undefined);
      setMessage("Review deleted and report closed.");
      setConfirmDelete(null);
      await load();
      void loadStats();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to delete review");
    } finally {
      setConfirming(false);
    }
  }

  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;

  const resolutionRate =
    stats && stats.reports.total > 0
      ? Math.round((stats.reports.resolved / stats.reports.total) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {!stats ? (
        <StatCardsSkeleton count={4} />
      ) : (
        <div className="flex flex-wrap gap-3">
          <StatCard
            label="Total Reports"
            value={stats.reports.total}
            icon={Flag}
            tone="primary"
            active={status === "all"}
            onClick={() => {
              setStatus("all");
              setPage(1);
            }}
          />
          <StatCard
            label="Open"
            value={stats.reports.open}
            icon={AlertCircle}
            tone="warning"
            urgent={stats.reports.open > 0}
            active={status === "open"}
            onClick={() => {
              setStatus("open");
              setPage(1);
            }}
          />
          <StatCard
            label="Resolved"
            value={stats.reports.resolved}
            icon={Check}
            tone="success"
            active={status === "resolved"}
            onClick={() => {
              setStatus("resolved");
              setPage(1);
            }}
          />
          <StatCard
            label="Resolution Rate"
            value={`${resolutionRate}%`}
            icon={Percent}
            tone="primary"
          />
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-40">
          <label className="mb-1 block text-xs font-semibold">Status</label>
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-10 w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-xs font-semibold">Search</label>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch();
            }}
            placeholder="Dealer, author, or review title"
          />
        </div>
        <Button
          type="button"
          className="w-full sm:w-auto"
          disabled={searching || loading}
          onClick={() => void runSearch()}
        >
          {searching ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </>
          ) : (
            "Search"
          )}
        </Button>
        <p className="text-sm text-muted-foreground sm:ml-auto sm:self-center">
          {data ? `${data.total} report${data.total === 1 ? "" : "s"}` : ""}
        </p>
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      {loading ? (
        <ReportsSkeleton />
      ) : !data ? (
        <AdminLoadingState label="Unable to load reports" />
      ) : data.reports.length === 0 ? (
        <div className="rounded-lg border border-border bg-white p-8 text-center">
          <Flag className="mx-auto h-8 w-8 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium text-foreground">
            No reports here
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {status === "open"
              ? "When shoppers report a review, it will show up in this list."
              : "No reports match this filter."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reports.map((report) => {
            const resolving = actionKey === `${report.id}:resolve`;
            return (
              <article
                key={report.id}
                className="rounded-lg border border-border bg-white p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium capitalize",
                          report.status === "open"
                            ? "border-transparent bg-amber-100 text-amber-800"
                            : "border-transparent bg-success/10 text-success"
                        )}
                      >
                        {report.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(report.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">
                      {report.review.dealer.name}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Reported reason:{" "}
                      <span className="font-medium text-foreground">
                        {report.reason}
                      </span>
                    </p>
                    <p
                      className="mt-2 truncate text-sm text-foreground"
                      title={`${report.review.authorName} · ${report.review.overallRating}/5 · ${report.review.title}`}
                    >
                      <span className="font-medium">{report.review.authorName}</span>
                      {" · "}
                      {report.review.overallRating}/5 · {report.review.title}
                    </p>
                    <p className="mt-1 line-clamp-2 break-words text-sm text-muted-foreground">
                      {report.review.comment}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setViewing(report)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    {report.status === "open" && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={Boolean(actionKey)}
                        onClick={() => void resolve(report)}
                      >
                        {resolving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Resolve
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:bg-destructive/5 hover:text-destructive"
                      onClick={() => setConfirmDelete(report)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete review
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {data && data.total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-center text-sm text-muted-foreground sm:text-left">
            Page {page} / {totalPages}
          </span>
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

      <Dialog
        open={Boolean(viewing)}
        onOpenChange={(open) => !open && setViewing(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader className="pr-6">
            <DialogTitle>{viewing?.review.title}</DialogTitle>
            <DialogDescription>
              {viewing &&
                `${viewing.review.authorName} · ${viewing.review.dealer.name}`}
            </DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="min-w-0 max-h-[60vh] space-y-3 overflow-y-auto overflow-x-hidden text-sm">
              <p className="break-all">
                <span className="text-muted-foreground">Reason:</span>{" "}
                <span className="font-medium">{viewing.reason}</span>
              </p>
              <p>
                <span className="text-muted-foreground">Rating:</span>{" "}
                {viewing.review.overallRating}/5
              </p>
              <p className="whitespace-pre-wrap break-all leading-relaxed">
                {viewing.review.comment}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title="Delete reported review?"
        description={
          confirmDelete
            ? `Delete “${confirmDelete.review.title}” by ${confirmDelete.review.authorName}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete review"
        confirming={confirming}
        destructive
        onConfirm={() => void deleteReview()}
      />
    </div>
  );
}

function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const result = await adminApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setAdminToken(result.token);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-2 py-8 sm:px-4">
      <form
        onSubmit={(e) => void onSubmit(e)}
        className="w-full max-w-xl space-y-6 rounded-xl border border-border/70 bg-white p-6 shadow-card sm:p-8"
      >
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" strokeWidth={2} aria-hidden />
          </span>
          <h2 className="mt-4 text-xl font-bold tracking-tight text-primary">
            Change password
          </h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
            Choose a strong password for this admin dashboard. You&apos;ll stay
            signed in after updating.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label
              htmlFor="admin-current-password"
              className="block text-xs font-semibold text-foreground"
            >
              Current password
            </label>
            <div className="relative">
              <Input
                id="admin-current-password"
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="h-11 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowCurrent((v) => !v)}
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-new-password"
              className="block text-xs font-semibold text-foreground"
            >
              New password
            </label>
            <div className="relative">
              <Input
                id="admin-new-password"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="h-11 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowNew((v) => !v)}
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-confirm-password"
              className="block text-xs font-semibold text-foreground"
            >
              Confirm new password
            </label>
            <div className="relative">
              <Input
                id="admin-confirm-password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={8}
                className="h-11 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm ? "Hide password" : "Show password"
                }
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800"
            role="status"
          >
            {message}
          </div>
        )}

        <Button type="submit" disabled={saving} className="h-11 w-full" size="lg">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating…
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </div>
  );
}

function AdminNavList({
  section,
  onSelect,
}: {
  section: Section;
  onSelect: (s: Section) => void;
}) {
  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onSelect(s.key)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
              section === s.key
                ? "bg-slate-100 text-foreground"
                : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-70" />
            {s.label}
          </button>
        );
      })}
    </nav>
  );
}

export function AdminPanel() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getAdminToken()));
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [section]);

  if (authed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
      </div>
    );
  }

  if (!authed) {
    return <LoginGate onSuccess={() => setAuthed(true)} />;
  }

  function signOut() {
    clearAdminToken();
    setAuthed(false);
  }

  const activeSection = SECTIONS.find((s) => s.key === section);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col overflow-visible border-r border-border bg-white md:sticky md:top-0 md:flex md:h-screen">
        <div className="flex shrink-0 items-center border-b border-border px-4 py-5">
          <BrandLogo />
        </div>
        <AdminNavList section={section} onSelect={setSection} />
        <div className="border-t border-border p-3">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 transition-opacity duration-300 ease-out md:hidden",
          mobileNavOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-5">
            <BrandLogo className="min-w-0" />
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close menu"
              className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <AdminNavList
            section={section}
            onSelect={(s) => {
              setSection(s);
              setMobileNavOpen(false);
            }}
          />
          <div className="border-t border-border p-3">
            <Button
              type="button"
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <header className="border-b border-border bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-foreground md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
                {activeSection?.label ?? "Admin"}
              </h1>
              <p className="hidden text-sm text-muted-foreground sm:block">
                Reviews, dealers, ratings, and badges
              </p>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          {section === "dashboard" && (
            <DashboardSection onNavigate={setSection} />
          )}
          {section === "reviews" && <ReviewsSection />}
          {section === "dealers" && <DealersSection />}
          {section === "ratings" && <RatingsSection />}
          {section === "badges" && <BadgesSection />}
          {section === "reports" && <ReportsSection />}
          {section === "blog" && <AdminBlogSection />}
          {section === "newsletter" && <AdminNewsletterSection />}
          {section === "security" && <SecuritySection />}
        </main>
      </div>
    </div>
  );
}
