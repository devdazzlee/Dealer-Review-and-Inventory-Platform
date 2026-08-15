import { dealerRepository } from "../repositories/dealer.repository";
import { toDealerDetailDto, toDealerSummaryDto, setDtoSettingsCache } from "../dtos/dealer.dto";
import { prisma } from "../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";
import {
  CreateDealerInput,
  DealerListFilters,
  UpdateDealerAdminInput,
} from "../types/dealer.types";
import { ListDealersQuery } from "../validators/dealer.validator";
import { generateSlug } from "../utils/slug";
import { ratingService } from "./rating.service";
import { fetchPlaceRating, isPlacesConfigured } from "./places.client";
import { fetchYelpBusinessRating, isYelpConfigured } from "./yelp.client";
import { ADMIN_DEALER_PAGE_SIZE } from "../config/constants";

/**
 * Resolves the googleRating/googleReviewCount to persist alongside a
 * googlePlaceId change. Throws if Places confirms the id doesn't resolve.
 * Returns undefined fields (skip) when the id is unchanged or Places isn't
 * configured yet — the daily ratings-sync job fills it in once it is.
 */
async function resolveGooglePlaceFields(
  nextPlaceId: string | null | undefined,
  currentPlaceId: string | null
): Promise<{ googleRating?: number | null; googleReviewCount?: number | null }> {
  if (nextPlaceId === undefined || nextPlaceId === currentPlaceId) return {};

  if (!nextPlaceId) {
    return { googleRating: null, googleReviewCount: null };
  }

  if (!isPlacesConfigured()) return {};

  const result = await fetchPlaceRating(nextPlaceId);
  if (!result.valid) {
    throw new ValidationError(
      "That Google Place ID doesn't resolve to a business — double-check it on Google Maps."
    );
  }
  return { googleRating: result.rating, googleReviewCount: result.reviewCount };
}

/**
 * Resolves the yelpRating/yelpReviewCount to persist alongside a
 * yelpBusinessId change. Mirrors resolveGooglePlaceFields — ratings are
 * never accepted directly from the admin form, only derived from a real
 * Yelp lookup, so a stored rating always traces back to a live API call.
 * Throws if Yelp confirms the id doesn't resolve.
 */
async function resolveYelpBusinessFields(
  nextBusinessId: string | null | undefined,
  currentBusinessId: string | null
): Promise<{ yelpRating?: number | null; yelpReviewCount?: number | null }> {
  if (nextBusinessId === undefined || nextBusinessId === currentBusinessId) return {};

  if (!nextBusinessId) {
    return { yelpRating: null, yelpReviewCount: null };
  }

  if (!isYelpConfigured()) return {};

  const result = await fetchYelpBusinessRating(nextBusinessId);
  if (!result.valid) {
    throw new ValidationError(
      "That Yelp Business ID doesn't resolve to a business — double-check it on Yelp."
    );
  }
  return { yelpRating: result.rating, yelpReviewCount: result.reviewCount };
}

export class DealerService {
  async listDealers(query: ListDealersQuery) {
    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);

    const filters: DealerListFilters = {
      state: query.state,
      city: query.city,
      search: query.search,
      minRating: query.minRating,
    };
    const dealers = await dealerRepository.findAll(filters);
    const counts = await prisma.vehicle.groupBy({
      by: ["dealerId"],
      where: { isActive: true },
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((row) => [row.dealerId, row._count._all]));
    return dealers.map((d) =>
      toDealerSummaryDto(d, settings, countMap.get(d.id) ?? 0)
    );
  }

  async getDealerBySlug(slug: string) {
    const settings = await ratingService.getSettings();
    const dealer = await dealerRepository.findBySlug(slug);

    if (!dealer) {
      throw new NotFoundError("Dealer");
    }

    const vehicleCount = await prisma.vehicle.count({
      where: { dealerId: dealer.id, isActive: true },
    });
    return toDealerDetailDto(dealer, settings, vehicleCount);
  }

  async createDealer(input: CreateDealerInput) {
    const slug = generateSlug(input.name);

    if (!slug) {
      throw new ConflictError("Unable to generate a valid slug from dealer name");
    }

    const slugExists = await dealerRepository.slugExists(slug);
    if (slugExists) {
      throw new ConflictError("A dealer with this name already exists");
    }

    const placeFields = await resolveGooglePlaceFields(input.googlePlaceId, null);
    const yelpFields = await resolveYelpBusinessFields(input.yelpBusinessId, null);
    const dealer = await dealerRepository.create({
      ...input,
      ...placeFields,
      ...yelpFields,
      slug,
    });
    const recalculated = await ratingService.recalculateDealer(dealer.id);
    const settings = await ratingService.getSettings();
    return toDealerDetailDto(recalculated, settings);
  }

  async adminList(options: {
    search?: string;
    featured?: boolean;
    hasBadge?: boolean;
    page: number;
  }) {
    const settings = await ratingService.getSettings();
    const result = await dealerRepository.findAdminList({
      search: options.search,
      featured: options.featured,
      hasBadge: options.hasBadge,
      page: options.page,
      pageSize: ADMIN_DEALER_PAGE_SIZE,
    });

    return {
      ...result,
      dealers: result.dealers.map((d) => toDealerDetailDto(d, settings)),
    };
  }

  async adminUpdate(id: string, input: UpdateDealerAdminInput) {
    const existing = await dealerRepository.findById(id);
    if (!existing) throw new NotFoundError("Dealer");

    const placeFields = await resolveGooglePlaceFields(
      input.googlePlaceId,
      existing.googlePlaceId
    );
    const yelpFields = await resolveYelpBusinessFields(
      input.yelpBusinessId,
      existing.yelpBusinessId
    );
    await dealerRepository.updateAdmin(id, { ...input, ...placeFields, ...yelpFields });
    const updated = await ratingService.recalculateDealer(id);
    const settings = await ratingService.getSettings();
    return toDealerDetailDto(updated, settings);
  }

  async adminDelete(id: string) {
    const existing = await dealerRepository.findById(id);
    if (!existing) throw new NotFoundError("Dealer");
    await dealerRepository.delete(id);
    return { success: true, id };
  }

  async ratingPreview(id: string) {
    const dealer = await dealerRepository.findById(id);
    if (!dealer) throw new NotFoundError("Dealer");
    const settings = await ratingService.getSettings();
    return ratingService.previewCombined(dealer, settings);
  }

  async listForSelect() {
    return dealerRepository.listForSelect();
  }

  async listBadged() {
    const settings = await ratingService.getSettings();
    const dealers = await dealerRepository.findBadged();
    return dealers.map((d) => toDealerSummaryDto(d, settings));
  }
}

export const dealerService = new DealerService();
