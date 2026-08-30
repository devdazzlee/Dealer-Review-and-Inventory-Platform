import { prisma } from "../lib/prisma";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError";
import { dealerRepository } from "../repositories/dealer.repository";
import { reviewRepository } from "../repositories/review.repository";
import { ratingService } from "./rating.service";
import { toDealerDetailDto } from "../dtos/dealer.dto";
import { DEALER_PORTAL_VEHICLE_PAGE_SIZE, VEHICLE_SOURCE } from "../config/constants";

interface DealerSelfUpdateInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  logo?: string | null;
}

interface DealerVehicleInput {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string | null;
  mileage?: number | null;
  bodyStyle?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  condition?: string | null;
  price?: number | null;
  description?: string | null;
  features?: string[];
  photos?: string[];
}

export class DealerPortalService {
  async getProfile(dealerId: string) {
    const dealer = await dealerRepository.findById(dealerId);
    if (!dealer) throw new NotFoundError("Dealer");
    const settings = await ratingService.getSettings();
    return toDealerDetailDto(dealer, settings);
  }

  async updateProfile(dealerId: string, input: DealerSelfUpdateInput) {
    const existing = await dealerRepository.findById(dealerId);
    if (!existing) throw new NotFoundError("Dealer");

    await dealerRepository.updateAdmin(dealerId, {
      name: input.name,
      phone: input.phone,
      email: input.email === "" ? null : input.email,
      website: input.website === "" ? null : input.website,
      description: input.description,
      logo: input.logo === "" ? null : input.logo,
    });
    const updated = await ratingService.recalculateDealer(dealerId);
    const settings = await ratingService.getSettings();
    return toDealerDetailDto(updated, settings);
  }

  async listOwnReviews(dealerId: string, options: { status?: string; page: number }) {
    return reviewRepository.findAdminList({ ...options, dealerId });
  }

  /** Same reply mechanism as the admin panel, but ownership-checked — a
   * dealer can only reply to reviews left on their own profile. */
  async replyToOwnReview(dealerId: string, reviewId: string, reply: string | null) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.dealerId !== dealerId) {
      throw new NotFoundError("Review");
    }
    const normalized = reply?.trim() || null;
    const updated = await reviewRepository.setReply(reviewId, normalized);
    return { success: true, review: updated };
  }

  async listOwnUpdates(dealerId: string) {
    return prisma.dealerUpdate.findMany({
      where: { dealerId },
      orderBy: { createdAt: "desc" },
    });
  }

  async postUpdate(dealerId: string, title: string, body: string) {
    return prisma.dealerUpdate.create({
      data: { dealerId, title: title.trim(), body: body.trim() },
    });
  }

  async updateOwnUpdate(dealerId: string, updateId: string, title: string, body: string) {
    const existing = await prisma.dealerUpdate.findUnique({ where: { id: updateId } });
    if (!existing || existing.dealerId !== dealerId) {
      throw new NotFoundError("Update");
    }
    return prisma.dealerUpdate.update({
      where: { id: updateId },
      data: { title: title.trim(), body: body.trim() },
    });
  }

  async deleteOwnUpdate(dealerId: string, updateId: string) {
    const existing = await prisma.dealerUpdate.findUnique({ where: { id: updateId } });
    if (!existing || existing.dealerId !== dealerId) {
      throw new NotFoundError("Update");
    }
    await prisma.dealerUpdate.delete({ where: { id: updateId } });
    return { success: true };
  }

  async listOwnVehicles(dealerId: string, options: { page: number }) {
    const pageSize = DEALER_PORTAL_VEHICLE_PAGE_SIZE;
    const page = Math.max(1, options.page);

    // activeTotal is separate from `total` (which counts sold vehicles too)
    // so the Overview tab's "Live vehicles" stat stays correct without
    // having to pull every page of the list just to count them.
    const [total, activeTotal, vehicles] = await Promise.all([
      prisma.vehicle.count({ where: { dealerId } }),
      prisma.vehicle.count({ where: { dealerId, isActive: true } }),
      prisma.vehicle.findMany({
        where: { dealerId },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { vehicles, total, activeTotal, page, pageSize };
  }

  /**
   * A vehicle added or edited here is permanently marked `source: "dealer"`
   * — the nightly Auto.dev sync explicitly skips that source (see
   * inventory-sync.service.ts), so it never gets overwritten or silently
   * marked sold by the feed, even for a VIN that also happens to be
   * Auto.dev-synced.
   */
  async createVehicle(dealerId: string, input: DealerVehicleInput) {
    if (!input.vin || !input.year || !input.make || !input.model) {
      throw new ValidationError("VIN, year, make, and model are required");
    }

    const vin = input.vin.trim().toUpperCase();
    const existing = await prisma.vehicle.findUnique({ where: { vin } });
    if (existing) {
      throw new ConflictError("A vehicle with this VIN already exists");
    }

    return prisma.vehicle.create({
      data: {
        dealerId,
        vin,
        year: input.year,
        make: input.make,
        model: input.model,
        trim: input.trim ?? null,
        mileage: input.mileage ?? null,
        bodyStyle: input.bodyStyle ?? null,
        fuelType: input.fuelType ?? null,
        transmission: input.transmission ?? null,
        exteriorColor: input.exteriorColor ?? null,
        interiorColor: input.interiorColor ?? null,
        condition: input.condition ?? null,
        price: input.price ?? null,
        description: input.description ?? null,
        features: input.features ?? [],
        photos: input.photos ?? [],
        cachedPhotoCount: input.photos?.length ?? 0,
        source: VEHICLE_SOURCE.dealer,
        isActive: true,
      },
    });
  }

  async updateVehicle(dealerId: string, vehicleId: string, input: DealerVehicleInput) {
    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing || existing.dealerId !== dealerId) {
      throw new NotFoundError("Vehicle");
    }

    let vin: string | undefined;
    if (input.vin) {
      vin = input.vin.trim().toUpperCase();
      if (vin !== existing.vin) {
        const vinTaken = await prisma.vehicle.findUnique({ where: { vin } });
        if (vinTaken) {
          throw new ConflictError("A vehicle with this VIN already exists");
        }
      }
    }

    return prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        ...(vin !== undefined ? { vin } : {}),
        ...(input.year !== undefined ? { year: input.year } : {}),
        ...(input.make !== undefined ? { make: input.make } : {}),
        ...(input.model !== undefined ? { model: input.model } : {}),
        ...(input.trim !== undefined ? { trim: input.trim } : {}),
        ...(input.mileage !== undefined ? { mileage: input.mileage } : {}),
        ...(input.bodyStyle !== undefined ? { bodyStyle: input.bodyStyle } : {}),
        ...(input.fuelType !== undefined ? { fuelType: input.fuelType } : {}),
        ...(input.transmission !== undefined ? { transmission: input.transmission } : {}),
        ...(input.exteriorColor !== undefined ? { exteriorColor: input.exteriorColor } : {}),
        ...(input.interiorColor !== undefined ? { interiorColor: input.interiorColor } : {}),
        ...(input.condition !== undefined ? { condition: input.condition } : {}),
        ...(input.price !== undefined ? { price: input.price } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.features !== undefined ? { features: input.features } : {}),
        ...(input.photos !== undefined
          ? { photos: input.photos, cachedPhotoCount: input.photos.length }
          : {}),
        // Any dealer-portal edit locks this VIN out of the Auto.dev sync
        // from now on, even if it started out as an auto-synced vehicle.
        source: VEHICLE_SOURCE.dealer,
      },
    });
  }

  async deleteVehicle(dealerId: string, vehicleId: string) {
    const existing = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!existing || existing.dealerId !== dealerId) {
      throw new NotFoundError("Vehicle");
    }
    await prisma.vehicle.delete({ where: { id: vehicleId } });
    return { success: true };
  }
}

export const dealerPortalService = new DealerPortalService();
