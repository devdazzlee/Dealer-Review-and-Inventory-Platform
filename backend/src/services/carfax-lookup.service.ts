import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { dealerRepository } from "../repositories/dealer.repository";
import { isPlausibleNameMatch } from "../lib/name-match";
import { ratingService } from "./rating.service";
import {
  buildCarfaxDealerUrl,
  fetchCarfaxRating,
  isCarfaxConfigured,
  CarfaxBlockedError,
} from "./carfax.client";

export interface CarfaxLookupResult {
  candidates: number;
  matched: number;
  notFound: number;
  lowConfidence: number;
  failed: number;
  blocked: boolean;
  message: string;
}

/**
 * Carfax blocks fast bursts hard, so pacing is deliberately slow and a run
 * bails out entirely once it's clearly been blacklisted rather than burning
 * the rest of the backlog on guaranteed 403s.
 */
const BASE_DELAY_MS = env.carfax.requestDelayMs;
/** Consecutive CarfaxBlockedErrors after which the whole run gives up for tonight. */
const BLOCK_STREAK_ABORT = 5;
/** Cap per run — a nightly cron shouldn't spend hours crawling one site. */
const MAX_PER_RUN = 400;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scrapes each due dealer's Carfax page for its aggregate star rating and
 * folds it into `carfaxRating` (same shape as googleRating / yelpRating). The
 * Carfax URL is either the one an admin pinned (`carfaxUrl`) or one derived
 * from the dealer's name + city + state + zip. The scraped page's own business
 * name is checked against the dealer's name before the rating is trusted, so a
 * wrong slug guess that resolves to a different dealer is discarded instead of
 * stored.
 */
export async function bulkAssignCarfaxRatings(): Promise<CarfaxLookupResult> {
  const startedAt = new Date();
  const result: CarfaxLookupResult = {
    candidates: 0,
    matched: 0,
    notFound: 0,
    lowConfidence: 0,
    failed: 0,
    blocked: false,
    message: "",
  };

  if (!isCarfaxConfigured()) {
    result.message = "CARFAX_LOOKUP_ENABLED=false; skipped Carfax scrape";
    await writeRun(startedAt, result);
    return result;
  }

  const staleBefore = new Date(
    Date.now() - env.carfax.refreshDays * 24 * 60 * 60 * 1000
  );
  const due = await dealerRepository.findDueForCarfaxLookup(staleBefore);
  const dealers = due.slice(0, MAX_PER_RUN);
  result.candidates = dealers.length;

  let blockStreak = 0;

  for (const dealer of dealers) {
    const url = dealer.carfaxUrl ?? buildCarfaxDealerUrl(dealer);

    try {
      const scraped = await fetchCarfaxRating(url);
      blockStreak = 0;

      // Page loaded but isn't a real rated dealer page (soft-404, unclaimed,
      // no aggregate rating). Stamp checkedAt so it drops to the back of the
      // queue instead of being retried every night.
      if (!scraped.valid || scraped.rating == null) {
        result.notFound += 1;
        await prisma.dealer.update({
          where: { id: dealer.id },
          data: { carfaxCheckedAt: new Date() },
        });
        await sleep(BASE_DELAY_MS);
        continue;
      }

      // A derived URL that resolves to a different business — don't attribute
      // that dealer's rating to this record.
      if (
        scraped.businessName &&
        !isPlausibleNameMatch(dealer.name, scraped.businessName)
      ) {
        result.lowConfidence += 1;
        console.warn(
          `[carfax-lookup] name mismatch, skipped: "${dealer.name}" -> "${scraped.businessName}" (${url})`
        );
        await prisma.dealer.update({
          where: { id: dealer.id },
          data: { carfaxCheckedAt: new Date() },
        });
        await sleep(BASE_DELAY_MS);
        continue;
      }

      // Rating backed by too few reviews to be meaningful.
      if (
        scraped.reviewCount != null &&
        scraped.reviewCount < env.carfax.minReviewCount
      ) {
        result.lowConfidence += 1;
        console.warn(
          `[carfax-lookup] thin rating skipped: "${dealer.name}" ${scraped.rating}★ from ${scraped.reviewCount} reviews`
        );
        await prisma.dealer.update({
          where: { id: dealer.id },
          data: { carfaxCheckedAt: new Date() },
        });
        await sleep(BASE_DELAY_MS);
        continue;
      }

      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          carfaxRating: scraped.rating,
          carfaxUrl: scraped.url,
          carfaxCheckedAt: new Date(),
        },
      });
      await ratingService.recalculateDealer(dealer.id);
      result.matched += 1;
    } catch (error) {
      if (error instanceof CarfaxBlockedError) {
        blockStreak += 1;
        result.failed += 1;
        console.warn(
          `[carfax-lookup] blocked (${blockStreak}/${BLOCK_STREAK_ABORT}) on "${dealer.name}"`
        );
        if (blockStreak >= BLOCK_STREAK_ABORT) {
          result.blocked = true;
          console.warn(
            `[carfax-lookup] ${blockStreak} consecutive blocks — aborting run, ${result.matched} matched before Carfax cut us off`
          );
          break;
        }
        // Back off progressively before the next attempt.
        await sleep(BASE_DELAY_MS * (blockStreak + 1));
        continue;
      }

      blockStreak = 0;
      result.failed += 1;
      console.error(`[carfax-lookup] ${dealer.name}`, error);
    }

    await sleep(BASE_DELAY_MS);
  }

  result.message = result.blocked
    ? `Carfax scrape: blocked by Carfax after ${result.matched} matched this run (${result.candidates} due). Retries next run.`
    : `Carfax scrape: ${result.candidates} due, ${result.matched} matched, ${result.notFound} no-rating, ${result.lowConfidence} low-confidence skipped, ${result.failed} failed`;
  await writeRun(startedAt, result);
  console.log(`[carfax-lookup] ${result.message}`);
  return result;
}

async function writeRun(
  startedAt: Date,
  result: CarfaxLookupResult
): Promise<void> {
  await prisma.syncRun.create({
    data: {
      job: "carfax-lookup",
      startedAt,
      finishedAt: new Date(),
      updated: result.matched,
      failed: result.failed,
      message: result.message,
    },
  });
}
