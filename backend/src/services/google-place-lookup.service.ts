import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http";
import { dealerRepository } from "../repositories/dealer.repository";
import { ratingService } from "./rating.service";
import {
  searchPlace,
  fetchPlaceRating,
  isPlacesConfigured,
  isPlausibleNameMatch,
  QuotaExceededError,
} from "./places.client";

export interface PlaceLookupResult {
  candidates: number;
  matched: number;
  notFound: number;
  lowConfidence: number;
  failed: number;
  quotaExhausted: boolean;
  message: string;
}

const BASE_DELAY_MS = 1000;
/** After this many 429s in a row, the per-minute quota is clearly exhausted — pause well past a minute rather than keep burning failed attempts. */
const RATE_LIMIT_STREAK_THRESHOLD = 3;
const RATE_LIMIT_COOLDOWN_MS = 75_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(error: unknown): boolean {
  return error instanceof HttpError && error.status === 429;
}

/**
 * Auto-assigns a Google Place ID to every real (autodev-sourced) dealer that
 * doesn't have one yet, by searching Places for "{name} {city} {state}".
 * Scoped to autodev dealers only — a fuzzy text match against a fictional
 * placeholder dealer name could land on an unrelated real business, which
 * would misattribute that business's real reviews to our fake record.
 */
export async function bulkAssignGooglePlaceIds(): Promise<PlaceLookupResult> {
  const startedAt = new Date();
  const result: PlaceLookupResult = {
    candidates: 0,
    matched: 0,
    notFound: 0,
    lowConfidence: 0,
    failed: 0,
    quotaExhausted: false,
    message: "",
  };

  if (!isPlacesConfigured()) {
    result.message = "GOOGLE_PLACES_API_KEY is not set; skipped Place ID lookup";
    await writeRun(startedAt, result);
    return result;
  }

  const dealers = await dealerRepository.findAutoDevSourcedWithoutPlaceId();
  result.candidates = dealers.length;

  let rateLimitStreak = 0;

  for (const dealer of dealers) {
    try {
      const match = await searchPlace(
        `${dealer.name} ${dealer.city} ${dealer.state}`
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
          `[google-place-lookup] low-confidence match skipped: "${dealer.name}" -> "${match.name}"`
        );
        await sleep(BASE_DELAY_MS);
        continue;
      }

      const place = await fetchPlaceRating(match.placeId);
      rateLimitStreak = 0;

      if (!place.valid) {
        result.notFound += 1;
        await sleep(BASE_DELAY_MS);
        continue;
      }

      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          googlePlaceId: match.placeId,
          googleRating: place.rating,
          googleReviewCount: place.reviewCount,
        },
      });
      await ratingService.recalculateDealer(dealer.id);
      result.matched += 1;
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        // Daily quota, not a transient rate limit — no amount of backoff
        // helps until Google resets it. Stop immediately rather than
        // burning the remaining candidates on guaranteed failures.
        result.quotaExhausted = true;
        console.warn(
          `[google-place-lookup] daily quota exhausted after ${result.matched} matches — stopping, will resume tomorrow`
        );
        break;
      }

      result.failed += 1;
      console.error(`[google-place-lookup] ${dealer.name}`, error);

      if (isRateLimited(error)) {
        rateLimitStreak += 1;
        if (rateLimitStreak >= RATE_LIMIT_STREAK_THRESHOLD) {
          console.warn(
            `[google-place-lookup] ${rateLimitStreak} consecutive 429s — cooling down ${RATE_LIMIT_COOLDOWN_MS / 1000}s`
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
    ? `Place lookup: daily quota exhausted after ${result.matched} matched this run (${result.candidates} candidates remained). Resumes automatically tomorrow.`
    : `Place lookup: ${result.candidates} candidates, ${result.matched} matched, ${result.notFound} not found, ${result.lowConfidence} low-confidence skipped, ${result.failed} failed`;
  await writeRun(startedAt, result);
  console.log(`[google-place-lookup] ${result.message}`);
  return result;
}

async function writeRun(startedAt: Date, result: PlaceLookupResult): Promise<void> {
  await prisma.syncRun.create({
    data: {
      job: "google-place-lookup",
      startedAt,
      finishedAt: new Date(),
      updated: result.matched,
      failed: result.failed,
      message: result.message,
    },
  });
}
