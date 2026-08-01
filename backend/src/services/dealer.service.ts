import { dealerRepository } from "../repositories/dealer.repository";
import { toDealerDetailDto, toDealerSummaryDto, setDtoSettingsCache } from "../dtos/dealer.dto";
import { ConflictError, NotFoundError } from "../errors/AppError";
import {
  CreateDealerInput,
  DealerListFilters,
  UpdateDealerAdminInput,
} from "../types/dealer.types";
import { ListDealersQuery } from "../validators/dealer.validator";
import { generateSlug } from "../utils/slug";
import { ratingService } from "./rating.service";
import { ADMIN_DEALER_PAGE_SIZE } from "../config/constants";

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
    return dealers.map((d) => toDealerSummaryDto(d, settings));
  }

  async getDealerBySlug(slug: string) {
    const settings = await ratingService.getSettings();
    const dealer = await dealerRepository.findBySlug(slug);

    if (!dealer) {
      throw new NotFoundError("Dealer");
    }

    return toDealerDetailDto(dealer, settings);
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

    const dealer = await dealerRepository.create({ ...input, slug });
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

    await dealerRepository.updateAdmin(id, input);
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
