import { api, extractData } from './api';
import type { Restaurant, CreateRestaurantDto, Menu, Dish, Promotion, RestaurantImage, RatingResponse, RatingStatsResponse, Schedule, ScheduleInput, ImageReorderItem, Section, RestaurantTable } from '@/types/restaurant';
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

  async getCategories() {
    return extractData<{ id: string; name: string; iconUrl?: string }[]>(
      await api.get('/v1/categories')
    );
  },

  async getBySlug(slug: string) {
    return extractData<Restaurant>(await api.get(`/v1/restaurants/slug/${slug}`));
  },

  async search(params: {
    name?: string;
    city?: string;
    categoryId?: string;
    priceRange?: string;
    page?: number;
    size?: number;
  }) {
    return extractData<PagedResponse<Restaurant>>(
      await api.get('/v1/restaurants/search', { params })
    );
  },

  async getAvailableNow() {
    return extractData<string[]>(await api.get('/v1/restaurants/available-now'));
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

  async update(id: string, data: CreateRestaurantDto) {
    return extractData<Restaurant>(await api.put(`/v1/restaurants/${id}`, data));
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

  /** Platos disponibles del restaurante (para el pre-pedido al reservar, S10-07). */
  async getRestaurantDishes(restaurantId: string) {
    return extractData<Dish[]>(await api.get(`/v1/dishes/restaurant/${restaurantId}`));
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

  async getActivePromotions(restaurantId: string) {
    return extractData<Promotion[]>(await api.get(`/v1/promotions/restaurant/${restaurantId}/active`));
  },

  async createPromotion(restaurantId: string, params: Record<string, string | number | undefined>) {
    return extractData<Promotion>(await api.post(`/v1/promotions/restaurant/${restaurantId}`, null, { params }));
  },

  async togglePromotion(id: string) {
    return extractData<Promotion>(await api.patch(`/v1/promotions/${id}/toggle`));
  },

  async deletePromotion(id: string) {
    return api.delete(`/v1/promotions/${id}`);
  },

  async generatePromotionFlyer(id: string) {
    return extractData<Promotion>(await api.post(`/v1/promotions/${id}/flyer`));
  },

  // Ofertas activas (con flyer) de todos los restaurantes, para el carrusel.
  async getPromotionsShowcase() {
    return extractData<Promotion[]>(await api.get('/v1/promotions/showcase'));
  },

  // ── Horarios (S2-02) ──────────────────────────────────────────
  async getSchedules(restaurantId: string) {
    return extractData<Schedule[]>(await api.get(`/v1/restaurants/${restaurantId}/schedules`));
  },

  async updateSchedules(restaurantId: string, schedules: ScheduleInput[]) {
    return extractData<Schedule[]>(await api.put(`/v1/restaurants/${restaurantId}/schedules`, schedules));
  },

  // ── Secciones y mesas (S7-01) ─────────────────────────────────
  async getSections(restaurantId: string) {
    return extractData<Section[]>(await api.get(`/v1/restaurants/${restaurantId}/sections`));
  },
  async addSection(restaurantId: string, data: { name: string; type: string; capacity: number }) {
    return extractData<Section>(await api.post(`/v1/restaurants/${restaurantId}/sections`, data));
  },
  async deleteSection(restaurantId: string, sectionId: string) {
    return api.delete(`/v1/restaurants/${restaurantId}/sections/${sectionId}`);
  },
  async getTables(restaurantId: string) {
    return extractData<RestaurantTable[]>(await api.get(`/v1/restaurants/${restaurantId}/tables`));
  },
  async addTable(restaurantId: string, data: { tableNumber: string; capacity: number; sectionId?: string }) {
    return extractData<RestaurantTable>(await api.post(`/v1/restaurants/${restaurantId}/tables`, data));
  },
  async deleteTable(restaurantId: string, tableId: string) {
    return api.delete(`/v1/restaurants/${restaurantId}/tables/${tableId}`);
  },

  // ── Galería de fotos (S2-03) ──────────────────────────────────
  async addImage(restaurantId: string, data: { url: string; caption?: string; displayOrder?: number }) {
    return extractData<RestaurantImage>(await api.post(`/v1/restaurants/${restaurantId}/images`, data));
  },

  async deleteImage(restaurantId: string, imageId: string) {
    return api.delete(`/v1/restaurants/${restaurantId}/images/${imageId}`);
  },

  async reorderImages(restaurantId: string, items: ImageReorderItem[]) {
    return extractData<RestaurantImage[]>(await api.patch(`/v1/restaurants/${restaurantId}/images/reorder`, items));
  },

  async checkAvailability(restaurantId: string, date: string, time: string, partySize: number) {
    return extractData<any>(
      await api.get(`/v1/restaurants/${restaurantId}/availability`, {
        params: { date, time, partySize }
      })
    );
  },
};
