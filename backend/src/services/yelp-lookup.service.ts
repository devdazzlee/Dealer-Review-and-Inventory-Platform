import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { dealerRepository } from "../repositories/dealer.repository";
import { ratingService } from "./rating.service";
import { isPlausibleNameMatch } from "../lib/name-match";
import {
  searchYelpBusiness,
  isYelpConfigured,
  YelpQuotaExceededError,
} from "./yelp.client";

export interface YelpLookupResult {
  candidates: number;
  matched: number;
  notFound: number;
  lowConfidence: number;
  failed: number;
  quotaExhausted: boolean;
  message: string;
}

const BASE_DELAY_MS = 1000;
/** After this many 429s in a row, the per-minute rate limit is clearly exhausted — pause well past a minute rather than keep burning failed attempts. */
const RATE_LIMIT_STREAK_THRESHOLD = 3;
const RATE_LIMIT_COOLDOWN_MS = 75_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(error: unknown): boolean {
  return error instanceof HttpError && error.status === 429;
}

/**
 * Auto-assigns a Yelp business ID and rating to every real (autodev-sourced)
 * dealer that doesn't have one yet, by searching Yelp for "{name}" near
 * "{city}, {state}". Scoped to autodev dealers only — a fuzzy text match
 * against a fictional placeholder dealer name could land on an unrelated
 * real business, which would misattribute that business's real reviews to
 * our fake record.
 *
 * Yelp's rating is stored but deliberately excluded from the combined
 * average in rating.ts — Yelp's API terms forbid blending its content into
 * an aggregated multi-source score, so it's surfaced as its own standalone
 * badge instead.
 */
export async function bulkAssignYelpRatings(): Promise<YelpLookupResult> {
  const startedAt = new Date();
  const result: YelpLookupResult = {
    candidates: 0,
    matched: 0,
    notFound: 0,
    lowConfidence: 0,
    failed: 0,
    quotaExhausted: false,
    message: "",
  };

  if (!isYelpConfigured()) {
    result.message = "YELP_API_KEY is not set; skipped Yelp lookup";
    await writeRun(startedAt, result);
    return result;
  }

  const dealers = await dealerRepository.findAutoDevSourcedWithoutYelpId();
  result.candidates = dealers.length;

  let rateLimitStreak = 0;

  for (const dealer of dealers) {
    try {
      const match = await searchYelpBusiness(
        dealer.name,
        dealer.city,
        dealer.state
      );
      rateLimitStreak = 0;

      if (!match) {
        result.notFound += 1;
        await sleep(BASE_DELAY_MS);
        continue;
      }

      if (!isPlausibleNameMatch(dealer.name, match.name)) {
        // Fuzzy text search landed on an unrelated business — don't
        // misattribute a stranger's real reviews to this dealer.
        result.lowConfidence += 1;
        console.warn(
          `[yelp-lookup] low-confidence match skipped: "${dealer.name}" -> "${match.name}"`
        );
        await sleep(BASE_DELAY_MS);
        continue;
      }

      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          yelpBusinessId: match.businessId,
          yelpRating: match.rating,
          yelpReviewCount: match.reviewCount,
        },
      });
      await ratingService.recalculateDealer(dealer.id);
      result.matched += 1;
    } catch (error) {
      if (error instanceof YelpQuotaExceededError) {
        // Daily cap, not transient — no amount of backoff helps until it
        // resets. Stop immediately rather than burning the remaining
        // candidates on guaranteed failures.
        result.quotaExhausted = true;
        console.warn(
          `[yelp-lookup] Yelp quota exhausted after ${result.matched} matches — stopping, will resume tomorrow`
        );
        break;
      }

      result.failed += 1;
      console.error(`[yelp-lookup] ${dealer.name}`, error);

      if (isRateLimited(error)) {
        rateLimitStreak += 1;
        if (rateLimitStreak >= RATE_LIMIT_STREAK_THRESHOLD) {
          console.warn(
            `[yelp-lookup] ${rateLimitStreak} consecutive 429s — cooling down ${RATE_LIMIT_COOLDOWN_MS / 1000}s`
          );
          await sleep(RATE_LIMIT_COOLDOWN_MS);
          rateLimitStreak = 0;
        }
      } else {
        rateLimitStreak = 0;
      }
    }

    await sleep(BASE_DELAY_MS);
  }

  result.message = result.quotaExhausted
    ? `Yelp lookup: quota exhausted after ${result.matched} matched this run (${result.candidates} candidates remained). Resumes automatically tomorrow.`
    : `Yelp lookup: ${result.candidates} candidates, ${result.matched} matched, ${result.notFound} not found, ${result.lowConfidence} low-confidence skipped, ${result.failed} failed`;
  await writeRun(startedAt, result);
  console.log(`[yelp-lookup] ${result.message}`);
  return result;
}

async function writeRun(startedAt: Date, result: YelpLookupResult): Promise<void> {
  await prisma.syncRun.create({
    data: {
      job: "yelp-lookup",
      startedAt,
      finishedAt: new Date(),
      updated: result.matched,
      failed: result.failed,
      message: result.message,
    },
  });
}
