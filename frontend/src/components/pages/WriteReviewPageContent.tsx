"use client";

import Link from "next/link";
import {
  MessageSquare,
  Star,
  PenLine,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContentPage,
  ContentSection,
  ContentSectionHeader,
  PageCtaBand,
} from "@/components/layout/ContentPage";
import { SeoContentSection } from "@/components/seo/SeoContentSection";
import { LocationFaqSection } from "@/components/dealers/LocationFaqSection";
import { ROUTES, SITE } from "@/config/constants";
import {
  WRITE_REVIEW_FAQ_ITEMS,
  WRITE_REVIEW_SEO_CONTENT,
} from "@/config/seo-content";

const REVIEW_INCLUDES = [
  "Overall rating from 1 to 5 stars",
  "Category ratings for service, quality, friendliness, and pricing",
  "Written comments about your visit",
  "Your name shown as first name and last initial",
  "Moderation before your review goes live",
] as const;

const WHY_REVIEW = [
  {
    icon: MessageSquare,
    title: "Help your neighbors",
    text: "A detailed review saves the next buyer from a bad experience or points them to a great one.",
  },
  {
    icon: Star,
    title: "Keep ratings honest",
    text: "The more voices on a dealership, the more accurate the average score becomes for everyone.",
  },
  {
    icon: PenLine,
    title: "Takes a few minutes",
    text: "Open any dealer profile, go to the Reviews tab, and share your experience.",
  },
] as const;

export function WriteReviewPageContent() {
  return (
    <ContentPage
      title="Write a Review"
      subtitle="Your experience helps the next buyer make a smarter choice. Reviews are moderated before they appear publicly."
      badge="Now open"
    >
      <ContentSection>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-card p-8 sm:p-10 shadow-sm">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 mb-6">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Review submission is live
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Find your dealership, open the Reviews tab, and submit your
              rating. Every review is checked by our team before it appears on
              the dealer profile.
            </p>
            <Button asChild variant="gold" className="mt-6">
              <Link href={ROUTES.dealers}>
                Find a dealer to review
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div>
            <ContentSectionHeader
              title="What to include"
              description="Helpful reviews cover the full visit, not just the sticker price."
            />
            <ul className="mt-4 space-y-3">
              {REVIEW_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </ContentSection>

      <ContentSection>
        <ContentSectionHeader
          title={`Why review on ${SITE.name}?`}
          description="Independent feedback keeps combined ratings trustworthy."
        />
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {WHY_REVIEW.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border/70 bg-white p-5 shadow-card"
            >
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-bold text-primary">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </ContentSection>

      <LocationFaqSection items={WRITE_REVIEW_FAQ_ITEMS} title="Review FAQs" />
      <SeoContentSection content={WRITE_REVIEW_SEO_CONTENT} variant="muted" />
      <PageCtaBand
        title="Ready to share your experience?"
        description="Browse dealers and leave a review on the profile that matches your visit."
      >
        <Button asChild variant="gold">
          <Link href={ROUTES.dealers}>Browse dealers</Link>
        </Button>
      </PageCtaBand>
    </ContentPage>
  );
}
