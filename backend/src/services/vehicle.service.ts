import { ratingService } from "./rating.service";
import { setDtoSettingsCache } from "../dtos/dealer.dto";
import { toVehicleDto } from "../dtos/vehicle.dto";
import {
  vehicleRepository,
  type VehicleListQuery,
} from "../repositories/vehicle.repository";
import { NotFoundError } from "../errors/AppError";

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

  async sitemapEntries() {
    const vehicles = await vehicleRepository.findAllActive();
    return vehicles.map((vehicle) => ({
      id: vehicle.id,
      updatedAt: vehicle.updatedAt,
    }));
  }

  async featured(limit: number, location?: { city?: string; state?: string }) {
    const settings = await ratingService.getSettings();
    setDtoSettingsCache(settings);
    const { vehicles } = await vehicleRepository.findMany({
      city: location?.city,
      state: location?.state,
      page: 1,
      pageSize: limit,
      sort: "relevance",
    });
    if (vehicles.length >= limit || !location?.city) {
      return vehicles.slice(0, limit).map((vehicle) => toVehicleDto(vehicle, settings));
    }
    const rest = await vehicleRepository.findMany({
      page: 1,
      pageSize: limit,
      sort: "relevance",
    });
    const seen = new Set(vehicles.map((v) => v.id));
    const merged = [
      ...vehicles,
      ...rest.vehicles.filter((item) => !seen.has(item.id)),
    ].slice(0, limit);
    return merged.map((vehicle) => toVehicleDto(vehicle, settings));
  }
}

export const vehicleService = new VehicleService();
