import { api, extractData } from './api';
import type { RestaurantStats, RestaurantStatsParams } from '@/types/stats';

export const statsService = {
  async getRestaurantStats(restaurantId: string, params: RestaurantStatsParams = {}) {
    return extractData<RestaurantStats>(
      await api.get(`/v1/restaurants/${restaurantId}/stats`, { params })
    );
  },
};
