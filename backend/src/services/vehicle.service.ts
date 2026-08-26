import { ratingService } from "./rating.service";
import { setDtoSettingsCache } from "../dtos/dealer.dto";
import { toVehicleDto } from "../dtos/vehicle.dto";
import {
  vehicleRepository,
  type VehicleListQuery,
} from "../repositories/vehicle.repository";
import { NotFoundError } from "../errors/AppError";
import { buildVehicleSlug, extractVehicleShortId } from "../utils/vehicle-slug";

export class VehicleService {
  async list(query: VehicleListQuery) {
    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const { vehicles, total } = await vehicleRepository.findMany(query);
    return {
      data: vehicles.map((vehicle) => toVehicleDto(vehicle, settings)),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  async getById(id: string) {
    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);
    const vehicle = await vehicleRepository.findById(id);
    if (!vehicle) throw new NotFoundError("Vehicle");
    const similar = await vehicleRepository.findSimilar(vehicle, 3);
    return {
      vehicle: toVehicleDto(vehicle, settings),
      similar: similar.map((item) => toVehicleDto(item, settings)),
    };
  }

  async listByDealerSlug(slug: string) {
    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);
    const vehicles = await vehicleRepository.findByDealerSlug(slug);
    return { data: vehicles.map((vehicle) => toVehicleDto(vehicle, settings)) };
  }

  /** SEO URL resolution — see repository.findBySlug for the lookup contract. */
  async getBySlug(dealerSlug: string, vehicleSlug: string) {
    const shortId = extractVehicleShortId(vehicleSlug);
    if (!shortId) throw new NotFoundError("Vehicle");

    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);
    const vehicle = await vehicleRepository.findBySlug(dealerSlug, shortId);
    if (!vehicle) throw new NotFoundError("Vehicle");
    const similar = await vehicleRepository.findSimilar(vehicle, 3);
    return {
      vehicle: toVehicleDto(vehicle, settings),
      similar: similar.map((item) => toVehicleDto(item, settings)),
    };
  }

  async sitemapEntries() {
    const vehicles = await vehicleRepository.findAllActive();
    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      dealerSlug: vehicle.dealer.slug,
      slug: buildVehicleSlug(vehicle),
      updatedAt: vehicle.updatedAt,
    }));
  }

  /**
   * Same tiering as TopRatedDealers (frontend/src/components/home/TopRatedDealers.tsx):
   * same-state first, exact-city sorted to the front within that, and only
   * fall all the way back to a nationwide list if the state itself doesn't
   * have enough inventory. A city-only filter (the previous approach) skips
   * straight from "exact city" to "no filter at all," so a visitor whose
   * city has no dealer stock — despite their own state having some, just in
   * a different city — saw the same generic nationwide list as someone with
   * no location at all.
   */
  async featured(limit: number, location?: { city?: string; state?: string }) {
    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);

    if (!location?.state) {
      const { vehicles } = await vehicleRepository.findMany({
        page: 1,
        pageSize: limit,
        sort: "relevance",
      });
      return vehicles.slice(0, limit).map((vehicle) => toVehicleDto(vehicle, settings));
    }

    const { vehicles: stateVehicles } = await vehicleRepository.findMany({
      state: location.state,
      page: 1,
      pageSize: limit,
      sort: "relevance",
    });

    const city = location.city?.toLowerCase();
    const local = city
      ? stateVehicles.filter((v) => v.dealer.city.toLowerCase() === city)
      : [];
    const localIds = new Set(local.map((v) => v.id));
    const prioritized = [...local, ...stateVehicles.filter((v) => !localIds.has(v.id))];

    if (prioritized.length >= limit) {
      return prioritized.slice(0, limit).map((vehicle) => toVehicleDto(vehicle, settings));
    }

    const { vehicles: rest } = await vehicleRepository.findMany({
      page: 1,
      pageSize: limit,
      sort: "relevance",
    });
    const seen = new Set(prioritized.map((v) => v.id));
    const merged = [
      ...prioritized,
      ...rest.filter((item) => !seen.has(item.id)),
    ].slice(0, limit);
    return merged.map((vehicle) => toVehicleDto(vehicle, settings));
  }
}

export const vehicleService = new VehicleService();
