import { prisma } from "../lib/prisma";
import { DEALER_DISCOVERY, DISCOVERY_TARGET_ZIPS } from "../config/constants";
import {
  discoverDealersNearZip,
  isAutoDevConfigured,
  AutoDevQuotaExceededError,
  type DiscoveredDealer,
} from "./autodev.client";
import { dealerRepository } from "../repositories/dealer.repository";
import { generateSlug } from "../utils/slug";
import { withTimeout } from "../lib/http";

/** One region (Auto.dev search + all its dealer DB writes) should never take this long. */
const REGION_TIMEOUT_MS = 60_000;

export interface DealerDiscoveryResult {
  regionsSearched: number;
  found: number;
  added: number;
  replaced: number;
  skipped: number;
  failed: number;
  quotaExhausted: boolean;
  message: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function uniqueSlugFor(name: string): Promise<string | null> {
  const base = generateSlug(name);
  if (!base) return null;

  let slug = base;
  let suffix = 2;
  while (await dealerRepository.slugExists(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

/**
 * Onboards one discovered dealer: skips it if already known by
 * autoDevDealerId, otherwise replaces a placeholder ("manual") dealer in the
 * same city if one exists, then inserts the real record. Never fabricates a
 * street address or phone number — Auto.dev doesn't provide either.
 */
async function onboardDealer(
  discovered: DiscoveredDealer
): Promise<"added" | "replaced" | "skipped"> {
  const existing = await dealerRepository.findByAutoDevDealerId(
    discovered.autoDevDealerId
  );
  if (existing) return "skipped";

  const slug = await uniqueSlugFor(discovered.name);
  if (!slug) return "skipped";

  const placeholder = await dealerRepository.findManualDealerInCity(
    discovered.city,
    discovered.state
  );
  if (placeholder) {
    // Cascades to the placeholder's fake reviews and template vehicles.
    await dealerRepository.delete(placeholder.id);
  }

  await dealerRepository.create({
    name: discovered.name,
    slug,
    address: null,
    city: discovered.city,
    state: discovered.state,
    zip: discovered.zip,
    website: discovered.website,
    autoDevDealerId: discovered.autoDevDealerId,
    source: "autodev",
    featured: false,
  });

  return placeholder ? "replaced" : "added";
}

async function writeRun(
  startedAt: Date,
  result: DealerDiscoveryResult
): Promise<void> {
  await prisma.syncRun.create({
    data: {
      job: "dealer-discovery",
      startedAt,
      finishedAt: new Date(),
      added: result.added,
      updated: result.replaced,
      failed: result.failed,
      message: result.message,
    },
  });
}

async function processRegion(
  target: { city: string; state: string; zip: string },
  seenDealerIds: Set<string>,
  result: DealerDiscoveryResult
): Promise<void> {
  const dealers = await discoverDealersNearZip({
    zip: target.zip,
    distance: DEALER_DISCOVERY.distanceMiles,
    maxPages: DEALER_DISCOVERY.maxPagesPerZip,
  });

  for (const dealer of dealers) {
    if (seenDealerIds.has(dealer.autoDevDealerId)) continue;
    seenDealerIds.add(dealer.autoDevDealerId);
    result.found += 1;

    try {
      const outcome = await onboardDealer(dealer);
      result[outcome] += 1;
    } catch (error) {
      result.failed += 1;
      console.error(
        `[dealer-discovery] failed onboarding ${dealer.name}`,
        error
      );
    }
  }
}

/**
 * Searches a curated set of metro zip codes for real Auto.dev dealers and
 * onboards any not already in the database. Auto.dev has no nationwide
 * "browse all dealers" endpoint, so this approximates national coverage
 * region by region — see DISCOVERY_TARGET_ZIPS.
 */
export async function discoverRealDealers(): Promise<DealerDiscoveryResult> {
  const startedAt = new Date();
  const result: DealerDiscoveryResult = {
    regionsSearched: 0,
    found: 0,
    added: 0,
    replaced: 0,
    skipped: 0,
    failed: 0,
    quotaExhausted: false,
    message: "",
  };

  if (!isAutoDevConfigured()) {
    result.message = "AUTODEV_API_KEY is not set; skipped dealer discovery";
    await writeRun(startedAt, result);
    return result;
  }

  const seenDealerIds = new Set<string>();

  for (const target of DISCOVERY_TARGET_ZIPS) {
    result.regionsSearched += 1;

    try {
      await withTimeout(
        processRegion(target, seenDealerIds, result),
        REGION_TIMEOUT_MS,
        `region ${target.city}, ${target.state}`
      );
    } catch (error) {
      if (error instanceof AutoDevQuotaExceededError) {
        // Monthly cap, not transient — every remaining region would fail
        // the same way. Stop now instead of burning through the rest.
        result.quotaExhausted = true;
        console.warn(
          `[dealer-discovery] Auto.dev monthly quota exhausted after ${result.regionsSearched} regions — stopping`
        );
        break;
      }
      result.failed += 1;
      // A stuck Neon connection or a hung Auto.dev call shouldn't be able to
      // block the other 60+ regions for hours — abandon this one and move on.
      console.error(
        `[dealer-discovery] zip ${target.zip} (${target.city}) failed or timed out`,
        error
      );
    }

    await sleep(DEALER_DISCOVERY.delayMsBetweenZips);
  }

  result.message = result.quotaExhausted
    ? `Discovery: Auto.dev monthly quota exhausted after ${result.regionsSearched}/${DISCOVERY_TARGET_ZIPS.length} regions. +${result.added} new, ${result.replaced} replaced. Resumes when quota resets or plan is upgraded.`
    : `Discovery: ${result.regionsSearched} regions searched, ${result.found} dealers found, +${result.added} new, ${result.replaced} replaced placeholders, ${result.skipped} already known, ${result.failed} failed`;
  await writeRun(startedAt, result);
  console.log(`[dealer-discovery] ${result.message}`);
  return result;
}
