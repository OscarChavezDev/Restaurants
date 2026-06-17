import { api, extractData } from './api';
import type { Restaurant, CreateRestaurantDto, Menu, Dish, Promotion, RestaurantImage, RatingResponse, RatingStatsResponse } from '@/types/restaurant';
import type { PagedResponse } from '@/types/auth';

export const restaurantService = {
  async getAll(page = 0, size = 12, sortBy = 'avgRating', direction = 'DESC') {
    return extractData<PagedResponse<Restaurant>>(
      await api.get('/v1/restaurants', { params: { page, size, sortBy, direction } })
    );
  },

  async getById(id: string) {
    return extractData<Restaurant>(await api.get(`/v1/restaurants/${id}`));
  },

  async getBySlug(slug: string) {
    return extractData<Restaurant>(await api.get(`/v1/restaurants/slug/${slug}`));
  },

  async search(params: {
    name?: string;
    city?: string;
    category?: string;
    page?: number;
    size?: number;
  }) {
    return extractData<PagedResponse<Restaurant>>(
      await api.get('/v1/restaurants/search', { params })
    );
  },

  async getNearby(lat: number, lon: number, radiusKm = 5) {
    return extractData<Restaurant[]>(
      await api.get('/v1/restaurants/nearby', { params: { lat, lon, radiusKm } })
    );
  },

  async getNearEvent(eventId: string, radiusKm = 3) {
    return extractData<Restaurant[]>(
      await api.get(`/v1/restaurants/near-event/${eventId}`, { params: { radiusKm } })
    );
  },

  async create(data: CreateRestaurantDto) {
    return extractData<Restaurant>(await api.post('/v1/restaurants', data));
  },

  async updateStatus(id: string, status: string) {
    return extractData<Restaurant>(
      await api.patch(`/v1/restaurants/${id}/status`, null, { params: { status } })
    );
  },

  async delete(id: string) {
    return api.delete(`/v1/restaurants/${id}`);
  },

  async getMyRestaurants(page = 0, size = 10) {
    return extractData<PagedResponse<Restaurant>>(
      await api.get('/v1/restaurants/my-restaurants', { params: { page, size } })
    );
  },

  async getMenus(restaurantId: string) {
    return extractData<Menu[]>(await api.get(`/v1/menus/restaurant/${restaurantId}`));
  },

  async getDishes(menuId: string) {
    return extractData<Dish[]>(await api.get(`/v1/dishes/menu/${menuId}`));
  },

  async getImages(restaurantId: string) {
    return extractData<RestaurantImage[]>(await api.get(`/v1/restaurants/${restaurantId}/images`));
  },

  async getRatings(restaurantId: string, page = 0, size = 10) {
    return extractData<PagedResponse<RatingResponse>>(
      await api.get(`/v1/ratings/restaurant/${restaurantId}`, { params: { page, size } })
    );
  },

  async getRatingStats(restaurantId: string) {
    return extractData<RatingStatsResponse>(
      await api.get(`/v1/ratings/restaurant/${restaurantId}/stats`)
    );
  },

  async getPromotions(restaurantId: string) {
    return extractData<Promotion[]>(await api.get(`/v1/promotions/restaurant/${restaurantId}`));
  },
};
