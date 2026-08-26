import { visitRepository } from "../repositories/visit.repository";

const TOP_CITIES_LIMIT = 10;
const RECENT_LIMIT = 25;

export const visitService = {
  track(data: { city: string; stateCode: string; path?: string }) {
    return visitRepository.create(data);
  },

  async summary() {
    const [total, byState, topCities, recent] = await Promise.all([
      visitRepository.count(),
      visitRepository.byState(),
      visitRepository.topCities(TOP_CITIES_LIMIT),
      visitRepository.recent(RECENT_LIMIT),
    ]);

    return { total, byState, topCities, recent };
  },
};
