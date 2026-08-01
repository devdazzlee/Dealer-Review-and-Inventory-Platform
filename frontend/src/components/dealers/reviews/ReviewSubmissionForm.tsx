"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { InteractiveStarRating } from "@/components/shared/InteractiveStarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitReview } from "@/lib/api/reviews-client";
import { VISIT_TYPE_OPTIONS } from "@/types/dealer";
import { cn } from "@/lib/utils";

interface ReviewSubmissionFormProps {
  dealerSlug: string;
  dealerName: string;
  onSuccess?: () => void;
  className?: string;
}

interface FormErrors {
  authorName?: string;
  email?: string;
  overallRating?: string;
  title?: string;
  comment?: string;
}

const MIN_OPEN_MS = 5000;

export function ReviewSubmissionForm({
  dealerSlug,
  dealerName,
  onSuccess,
  className,
}: ReviewSubmissionFormProps) {
  const openedAt = useRef(Date.now());
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [overallRating, setOverallRating] = useState(0);
  const [customerServiceRating, setCustomerServiceRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [friendlinessRating, setFriendlinessRating] = useState(0);
  const [pricingRating, setPricingRating] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [visitDate, setVisitDate] = useState<Date | undefined>();
  const [visitType, setVisitType] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setCanSubmit(true), MIN_OPEN_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const commentCount = comment.length;

  const categoryRows = useMemo(
    () =>
      [
        {
          label: "Customer Service",
          value: customerServiceRating,
          onChange: setCustomerServiceRating,
        },
        {
          label: "Quality of Work",
          value: qualityRating,
          onChange: setQualityRating,
        },
        {
          label: "Friendliness",
          value: friendlinessRating,
          onChange: setFriendlinessRating,
        },
        { label: "Pricing", value: pricingRating, onChange: setPricingRating },
      ] as const,
    [
      customerServiceRating,
      qualityRating,
      friendlinessRating,
      pricingRating,
    ]
  );

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!authorName.trim() || authorName.trim().length < 2) {
      next.authorName = "Full name is required";
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.email = "A valid email is required";
    }
    if (overallRating < 1 || overallRating > 5) {
      next.overallRating = "Overall rating is required";
    }
    if (!title.trim()) next.title = "Review title is required";
    else if (title.trim().length > 100)
      next.title = "Title must be 100 characters or fewer";
    if (comment.trim().length < 25)
      next.comment = "Comment must be at least 25 characters";
    else if (comment.trim().length > 2000)
      next.comment = "Comment must be 2000 characters or fewer";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!canSubmit) {
      setErrorMessage("Please take a moment to complete the form before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReview({
        dealerSlug,
        authorName: authorName.trim(),
        email: email.trim(),
        overallRating,
        customerServiceRating: customerServiceRating || null,
        qualityRating: qualityRating || null,
        friendlinessRating: friendlinessRating || null,
        pricingRating: pricingRating || null,
        recommend,
        title: title.trim(),
        comment: comment.trim(),
        visitDate: visitDate ? visitDate.toISOString() : null,
        visitType: visitType || null,
        website: honeypot,
        formOpenMs: Date.now() - openedAt.current,
      });
      setSuccessMessage(result.message);
      onSuccess?.();
      setAuthorName("");
      setEmail("");
      setOverallRating(0);
      setCustomerServiceRating(0);
      setQualityRating(0);
      setFriendlinessRating(0);
      setPricingRating(0);
      setRecommend(null);
      setTitle("");
      setComment("");
      setVisitDate(undefined);
      setVisitType("");
      setErrors({});
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Unable to submit review."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div
        className={cn(
          "rounded-lg border border-success/30 bg-success/5 p-6 text-center shadow-card",
          className
        )}
      >
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h3 className="mt-3 text-lg font-bold text-primary">Review submitted</h3>
        <p className="mt-2 text-sm text-muted-foreground">{successMessage}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => setSuccessMessage(null)}
        >
          Write another review
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative space-y-5 rounded-lg border border-border/70 bg-white p-5 shadow-card sm:p-6",
        className
      )}
      noValidate
    >
      <div>
        <h3 className="text-lg font-bold text-primary">
          Write a review for {dealerName}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Reviews are moderated before they appear publicly. Your email is never
          shown.
        </p>
      </div>

      {/* Honeypot */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
        <label htmlFor={`hp-${dealerSlug}`}>Website</label>
        <input
          id={`hp-${dealerSlug}`}
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="authorName">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="authorName"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Jane Smith"
            aria-invalid={!!errors.authorName}
          />
          {errors.authorName && (
            <p className="mt-1 text-xs text-destructive">{errors.authorName}</p>
          )}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold" htmlFor="email">
            Email <span className="text-destructive">*</span>
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Not shown publicly — used for confirmation only.
          </p>
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">{errors.email}</p>
          )}
        </div>
      </div>

      <InteractiveStarRating
        label="Overall Star Rating"
        required
        size="xl"
        value={overallRating}
        onChange={setOverallRating}
        error={errors.overallRating}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {categoryRows.map((row) => (
          <InteractiveStarRating
            key={row.label}
            label={row.label}
            size="md"
            value={row.value}
            onChange={row.onChange}
          />
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">
          Would you recommend this dealer?
        </p>
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setRecommend(true)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              recommend === true
                ? "bg-success text-success-foreground"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            Yes
          </button>
          <button
            type="button"
            onClick={() => setRecommend(false)}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-semibold transition-colors",
              recommend === false
                ? "bg-destructive text-destructive-foreground"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            No
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="title">
          Review Title <span className="text-destructive">*</span>
        </label>
        <Input
          id="title"
          value={title}
          maxLength={100}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Sum up your experience"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {title.length}/100
        </p>
        {errors.title && (
          <p className="mt-1 text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold" htmlFor="comment">
          Review Comment <span className="text-destructive">*</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          maxLength={2000}
          onChange={(e) => setComment(e.target.value)}
          rows={5}
          placeholder="Tell others about your visit (minimum 25 characters)"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        <p
          className={cn(
            "mt-1 text-xs",
            commentCount < 25 ? "text-muted-foreground" : "text-primary"
          )}
        >
          {commentCount}/2000 characters
          {commentCount < 25 ? ` · ${25 - commentCount} more needed` : ""}
        </p>
        {errors.comment && (
          <p className="mt-1 text-xs text-destructive">{errors.comment}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Date of Visit
          </label>
          <DatePicker
            value={visitDate}
            onChange={setVisitDate}
            disablePast={false}
            placeholder="When did you visit?"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">
            Type of Visit
          </label>
          <Select
            value={visitType || undefined}
            onValueChange={setVisitType}
          >
            <SelectTrigger className="h-10 rounded-md bg-white">
              <SelectValue placeholder="Select visit type" />
            </SelectTrigger>
            <SelectContent>
              {VISIT_TYPE_OPTIONS.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      <Button
        type="submit"
        variant="gold"
        className="w-full sm:w-auto"
        disabled={submitting || !canSubmit}
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting…
          </>
        ) : !canSubmit ? (
          "Please wait a moment…"
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
