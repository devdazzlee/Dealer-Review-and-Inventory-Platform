import { prisma } from "../lib/prisma";
import { ratingService } from "./rating.service";
import { REVIEW_STATUS } from "../config/constants";
import {
  FIRST_NAMES,
  LAST_NAMES,
  TITLE_LEADS,
  TITLE_TAILS,
  COMMENT_OPENERS,
  COMMENT_DETAILS,
  COMMENT_CLOSERS,
  FULL_REVIEWS,
} from "../data/bergen-review-bank";

/**
 * Automated daily 5-star review poster. Runs for exactly one dealer.
 *
 * Guardrails:
 *   - Only ever touches the dealer whose slug is DAILY_REVIEW_DEALER_SLUG.
 *   - Every row it writes carries ipAddress === DAILY_REVIEW_MARKER and an
 *     email ending DAILY_REVIEW_EMAIL_DOMAIN, so the postings are easy to find
 *     or roll back later without affecting real customer reviews.
 *   - Refuses to reuse any author name, title, or comment already stored for
 *     the dealer (case-insensitive), so nothing ever repeats.
 */
export const DAILY_REVIEW_DEALER_SLUG = "bergen-car";
export const DAILY_REVIEW_MARKER = "DAILY_REVIEW_BOT";
export const DAILY_REVIEW_EMAIL_DOMAIN = "@bergen-daily-review.invalid";
export const DAILY_REVIEW_JOB = "daily-review";

const DAY_MS = 24 * 60 * 60 * 1000;
const COMPOSE_ATTEMPTS = 6000;

export interface DailyReviewResult {
  posted: boolean;
  job: typeof DAILY_REVIEW_JOB;
  reviewId?: string;
  authorName?: string;
  title?: string;
  platformRating?: number | null;
  platformReviewCount?: number;
  combinedRating?: number | null;
  message: string;
}

/** Deterministic PRNG so a given day picks the same content on a retry. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function seededShuffle<T>(input: T[], seed: number): T[] {
  const arr = input.slice();
  const rand = mulberry32(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Walk every first-name / last-name pairing exactly once in a rotated,
 * deterministic order and return the first that is not already used.
 */
function pickUniqueName(usedNames: Set<string>, daySalt: number): string {
  const F = FIRST_NAMES.length;
  const L = LAST_NAMES.length;
  const total = F * L;
  const step =
    [7919, 6113, 5237, 3541, 2777].find((s) => gcd(s, total) === 1) ?? 1;
  const offset = ((daySalt % total) + total) % total;

  for (let k = 0; k < total; k++) {
    const idx = (offset + k * step) % total;
    const name = `${FIRST_NAMES[idx % F]} ${LAST_NAMES[Math.floor(idx / F) % L]}`;
    if (!usedNames.has(norm(name))) return name;
  }
  // ~25k names would have to be taken to reach this; keep going rather than fail.
  for (let n = 2; ; n++) {
    const name = `${FIRST_NAMES[daySalt % F]} ${LAST_NAMES[(daySalt + n) % L]} ${n}`;
    if (!usedNames.has(norm(name))) return name;
  }
}

/**
 * Prefer a hand-written full review; fall back to composing one from the
 * opener / detail / closer banks. Returns a title + comment pair that collides
 * with nothing already stored for the dealer.
 */
function pickUniqueContent(
  usedTitles: Set<string>,
  usedComments: Set<string>,
  daySalt: number
): { title: string; comment: string } {
  for (const r of seededShuffle(FULL_REVIEWS, 0x5bce7 ^ daySalt)) {
    if (!usedTitles.has(norm(r.title)) && !usedComments.has(norm(r.comment))) {
      return { title: r.title, comment: r.comment };
    }
  }

  for (let a = 0; a < COMPOSE_ATTEMPTS; a++) {
    const rand = mulberry32((daySalt * 2654435761) ^ (a + 1));
    const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
    const title = `${pick(TITLE_LEADS)} ${pick(TITLE_TAILS)}`;
    const comment = `${pick(COMMENT_OPENERS)} ${pick(COMMENT_DETAILS)} ${pick(
      COMMENT_CLOSERS
    )}`;
    if (!usedTitles.has(norm(title)) && !usedComments.has(norm(comment))) {
      return { title, comment };
    }
  }

  throw new Error(
    "daily-review content bank exhausted; add entries to src/data/bergen-review-bank.ts"
  );
}

export async function postDailyBergenReview(): Promise<DailyReviewResult> {
  const startedAt = new Date();
  const daySalt = Math.floor(Date.now() / DAY_MS);

  const dealer = await prisma.dealer.findUnique({
    where: { slug: DAILY_REVIEW_DEALER_SLUG },
    select: { id: true, name: true },
  });

  if (!dealer) {
    const message = `Dealer "${DAILY_REVIEW_DEALER_SLUG}" not found; no review posted.`;
    await prisma.syncRun.create({
      data: {
        job: DAILY_REVIEW_JOB,
        startedAt,
        finishedAt: new Date(),
        failed: 1,
        message,
      },
    });
    return { posted: false, job: DAILY_REVIEW_JOB, message };
  }

  try {
    const existing = await prisma.review.findMany({
      where: { dealerId: dealer.id },
      select: { authorName: true, title: true, comment: true },
    });
    const usedNames = new Set(existing.map((r) => norm(r.authorName)));
    const usedTitles = new Set(existing.map((r) => norm(r.title)));
    const usedComments = new Set(existing.map((r) => norm(r.comment)));

    const authorName = pickUniqueName(usedNames, daySalt);
    const { title, comment } = pickUniqueContent(
      usedTitles,
      usedComments,
      daySalt
    );

    // Realistic arrival date somewhere in the last 7 days.
    const now = Date.now();
    const createdAt = new Date(
      now - Math.floor(Math.random() * 7 * DAY_MS) - Math.floor(Math.random() * DAY_MS)
    );
    const visitDate = new Date(
      createdAt.getTime() - (1 + Math.floor(Math.random() * 5)) * DAY_MS
    );
    const helpfulCount = Math.floor(Math.random() * 7); // 0..6
    const visitType = ["Purchased Used Car", "Purchased Used Car", "Purchased Used Car", "Purchased New Car", "Service Visit"][daySalt % 5];
    const email = `daily-review-${now}-${Math.floor(Math.random() * 1e6)}${DAILY_REVIEW_EMAIL_DOMAIN}`;

    const review = await prisma.review.create({
      data: {
        dealer: { connect: { id: dealer.id } },
        authorName,
        email,
        overallRating: 5,
        customerServiceRating: 5,
        qualityRating: 5,
        friendlinessRating: 5,
        pricingRating: 5,
        recommend: true,
        title,
        comment,
        visitDate,
        visitType,
        status: REVIEW_STATUS.approved,
        helpfulCount,
        notHelpfulCount: 0,
        ipAddress: DAILY_REVIEW_MARKER,
        createdAt,
      },
      select: { id: true },
    });

    const updated = await ratingService.recalculateDealer(dealer.id);

    const message = `Posted 5-star review by ${authorName} ("${title}"). Dealer now at platformRating ${updated.platformRating}, ${updated.platformReviewCount} platform reviews, combinedRating ${updated.combinedRating}.`;

    await prisma.syncRun.create({
      data: {
        job: DAILY_REVIEW_JOB,
        startedAt,
        finishedAt: new Date(),
        added: 1,
        message,
      },
    });

    console.log(`[daily-review] ${message}`);

    return {
      posted: true,
      job: DAILY_REVIEW_JOB,
      reviewId: review.id,
      authorName,
      title,
      platformRating: updated.platformRating,
      platformReviewCount: updated.platformReviewCount,
      combinedRating: updated.combinedRating,
      message,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "daily-review failed";
    await prisma.syncRun.create({
      data: {
        job: DAILY_REVIEW_JOB,
        startedAt,
        finishedAt: new Date(),
        failed: 1,
        message,
      },
    });
    console.error("[daily-review]", error);
    throw error;
  }
}
