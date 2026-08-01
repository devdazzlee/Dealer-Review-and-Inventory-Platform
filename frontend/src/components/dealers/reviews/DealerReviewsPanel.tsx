"use client";

import { useCallback, useEffect, useState } from "react";
import { Flag, Loader2, MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { format } from "date-fns";
import type { PublicReview, ReviewSort, ReviewStats } from "@/types/dealer";
import {
  fetchDealerReviews,
  fetchDealerReviewStats,
  reportReview,
  voteReviewHelpful,
} from "@/lib/api/reviews-client";
import { StarRating } from "@/components/shared/StarRating";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface DealerReviewsPanelProps {
  dealerSlug: string;
  onWriteReview: () => void;
}

function DistributionBars({ stats }: { stats: ReviewStats }) {
  return (
    <div className="space-y-1.5">
      {stats.distribution.map((row) => (
        <div key={row.stars} className="flex items-center gap-2 text-xs">
          <span className="w-6 font-semibold text-muted-foreground">
            {row.stars}★
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${row.percentage}%` }}
            />
          </div>
          <span className="w-16 text-right text-muted-foreground">
            {row.count} ({row.percentage}%)
          </span>
        </div>
      ))}
    </div>
  );
}

function CategoryAverages({ stats }: { stats: ReviewStats }) {
  const items = [
    { label: "Customer Service", value: stats.categoryAverages.customerService },
    { label: "Quality", value: stats.categoryAverages.quality },
    { label: "Friendliness", value: stats.categoryAverages.friendliness },
    { label: "Pricing", value: stats.categoryAverages.pricing },
  ];

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {items.map((item) => (
        <span key={item.label} className="text-muted-foreground">
          <span className="font-semibold text-foreground">{item.label}</span>{" "}
          {item.value != null ? (
            <span className="font-bold text-primary">{item.value.toFixed(1)}</span>
          ) : (
            "—"
          )}
        </span>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const [helpfulCount, setHelpfulCount] = useState(review.helpfulCount);
  const [notHelpfulCount, setNotHelpfulCount] = useState(review.notHelpfulCount);
  const [userVote, setUserVote] = useState<boolean | null>(null);
  const [votingAction, setVotingAction] = useState<"helpful" | "not-helpful" | null>(
    null
  );
  const [expanded, setExpanded] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("Spam or fake review");
  const [reporting, setReporting] = useState(false);
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  const PREVIEW_CHARS = 160;
  const needsCollapse = review.comment.length > PREVIEW_CHARS;
  const displayComment =
    !expanded && needsCollapse
      ? `${review.comment.slice(0, PREVIEW_CHARS).trimEnd()}…`
      : review.comment;
  const voting = votingAction !== null;

  async function vote(helpful: boolean) {
    if (voting) return;
    setVotingAction(helpful ? "helpful" : "not-helpful");
    try {
      const result = await voteReviewHelpful(review.id, helpful);
      setHelpfulCount(result.helpfulCount);
      setNotHelpfulCount(result.notHelpfulCount);
      setUserVote(result.userVote);
    } catch {
      // Keep prior counts on failure
    } finally {
      setVotingAction(null);
    }
  }

  async function submitReport() {
    if (reporting || reported) return;
    setReporting(true);
    setReportMessage(null);
    try {
      const result = await reportReview(review.id, reportReason);
      setReported(true);
      setReportMessage(result.message);
      setReportOpen(false);
    } catch (e) {
      setReportMessage(
        e instanceof Error ? e.message : "Unable to submit report"
      );
    } finally {
      setReporting(false);
    }
  }

  const posted = format(new Date(review.createdAt), "MMMM yyyy");

  return (
    <article className="overflow-hidden rounded-lg border border-border/70 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
          {review.initials}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="truncate font-bold text-primary">{review.authorName}</p>
            <span className="shrink-0 text-xs text-muted-foreground">{posted}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <StarRating rating={review.overallRating} size="sm" />
            {review.visitType && (
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-semibold text-primary">
                {review.visitType}
              </span>
            )}
          </div>
          <h4 className="mt-2.5 break-all font-bold text-foreground">
            {review.title}
          </h4>
          <p className="mt-1.5 break-all text-sm leading-relaxed text-foreground/90">
            {displayComment}
          </p>
          {needsCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {expanded ? "See less" : "See more"}
            </button>
          )}

          <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            {[
              ["Customer Service", review.customerServiceRating],
              ["Quality", review.qualityRating],
              ["Friendliness", review.friendlinessRating],
              ["Pricing", review.pricingRating],
            ].map(([label, value]) =>
              value != null ? (
                <div key={String(label)} className="flex items-center gap-2">
                  <span className="w-28 shrink-0">{label}</span>
                  <StarRating rating={value as number} size="sm" />
                </div>
              ) : null
            )}
          </div>

          {review.recommend != null && (
            <p
              className={cn(
                "mt-3 inline-flex rounded-md px-2.5 py-1 text-xs font-bold",
                review.recommend
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {review.recommend
                ? "Recommends this dealer"
                : "Does not recommend"}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={voting}
              onClick={() => vote(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                userVote === true
                  ? "border-primary bg-secondary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
                voting && "opacity-70"
              )}
            >
              {votingAction === "helpful" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsUp className="h-3.5 w-3.5" />
              )}
              {votingAction === "helpful" ? "Saving…" : `Helpful (${helpfulCount})`}
            </button>
            <button
              type="button"
              disabled={voting}
              onClick={() => vote(false)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                userVote === false
                  ? "border-primary bg-secondary text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary",
                voting && "opacity-70"
              )}
            >
              {votingAction === "not-helpful" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ThumbsDown className="h-3.5 w-3.5" />
              )}
              {votingAction === "not-helpful"
                ? "Saving…"
                : `Not Helpful (${notHelpfulCount})`}
            </button>
            <button
              type="button"
              disabled={reported || reporting}
              onClick={() => setReportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary disabled:opacity-60"
            >
              <Flag className="h-3.5 w-3.5" />
              {reported ? "Reported" : "Report"}
            </button>
          </div>

          {reportMessage && (
            <p className="mt-2 text-xs text-muted-foreground">{reportMessage}</p>
          )}
        </div>
      </div>

      <AlertDialog
        open={reportOpen}
        onOpenChange={(open) => {
          if (reporting) return;
          setReportOpen(open);
        }}
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Report this review?</AlertDialogTitle>
            <AlertDialogDescription>
              Tell us why this review should be reviewed by our team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Reason
            </label>
            <Select value={reportReason} onValueChange={setReportReason}>
              <SelectTrigger className="h-10 w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Spam or fake review">Spam or fake review</SelectItem>
                <SelectItem value="Offensive or inappropriate">
                  Offensive or inappropriate
                </SelectItem>
                <SelectItem value="Conflict of interest">
                  Conflict of interest
                </SelectItem>
                <SelectItem value="Not a real customer experience">
                  Not a real customer experience
                </SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reporting}>Cancel</AlertDialogCancel>
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "default" }),
                "inline-flex items-center gap-2"
              )}
              disabled={reporting}
              onClick={(e) => {
                e.preventDefault();
                void submitReport();
              }}
            >
              {reporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Submit report"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

export function DealerReviewsPanel({
  dealerSlug,
  onWriteReview,
}: DealerReviewsPanelProps) {
  const [sort, setSort] = useState<ReviewSort>("recent");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (nextPage: number, nextSort: ReviewSort, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);
      try {
        const [pageData, statsData] = await Promise.all([
          fetchDealerReviews(dealerSlug, { page: nextPage, sort: nextSort }),
          append ? Promise.resolve(null) : fetchDealerReviewStats(dealerSlug),
        ]);
        setReviews((prev) =>
          append ? [...prev, ...pageData.reviews] : pageData.reviews
        );
        setHasMore(pageData.hasMore);
        setTotal(pageData.total);
        setPage(pageData.page);
        if (statsData) setStats(statsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [dealerSlug]
  );

  useEffect(() => {
    void load(1, sort, false);
  }, [load, sort]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
        <div className="h-40 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load reviews"
        message={error}
        action={
          <Button type="button" onClick={() => void load(1, sort, false)}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <div>
      <div className="mb-6 space-y-4 rounded-lg border border-border/70 bg-white p-5 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="text-4xl font-extrabold text-primary">
              {stats?.averageRating != null
                ? stats.averageRating.toFixed(1)
                : "—"}
            </span>
            <div>
              {stats?.averageRating != null && (
                <StarRating rating={stats.averageRating} size="lg" />
              )}
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {total} {total === 1 ? "Review" : "Reviews"}
              </p>
            </div>
          </div>
          <Button type="button" variant="gold" onClick={onWriteReview}>
            Write a Review
          </Button>
        </div>

        {stats && stats.totalReviews > 0 && (
          <>
            <DistributionBars stats={stats} />
            <CategoryAverages stats={stats} />
          </>
        )}
      </div>

      {total === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No reviews yet. Be the first to review this dealer."
          description="Share your experience to help other shoppers make confident decisions."
          action={
            <Button type="button" variant="gold" onClick={onWriteReview}>
              Write a Review
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-muted-foreground">
              Showing {reviews.length} of {total}
            </p>
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as ReviewSort)}
            >
              <SelectTrigger className="h-9 w-44 rounded-lg bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="highest">Highest Rated</SelectItem>
                <SelectItem value="lowest">Lowest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={loadingMore}
                onClick={() => void load(page + 1, sort, true)}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  "Load More"
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
