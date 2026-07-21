import { api, extractData } from './api';
import type { Reservation, CreateReservationDto } from '@/types/reservation';
import type { PagedResponse } from '@/types/auth';

export const reservationService = {
  async create(data: CreateReservationDto) {
    return extractData<Reservation>(await api.post('/v1/reservations', data));
  },

  async getByCode(code: string) {
    return extractData<Reservation>(await api.get(`/v1/reservations/code/${code}`));
  },

  async updateSpecialRequests(id: string, text: string) {
    return extractData<Reservation>(await api.patch(`/v1/reservations/${id}/special-requests`, { text }));
  },

  async getByRestaurant(restaurantId: string, page = 0, size = 20) {
    return extractData<PagedResponse<Reservation>>(
      await api.get(`/v1/reservations/restaurant/${restaurantId}`, { params: { page, size } })
    );
  },

  async getMyReservations(page = 0, size = 10) {
    return extractData<PagedResponse<Reservation>>(
      await api.get('/v1/reservations/my-reservations', { params: { page, size } })
    );
  },

  async confirm(id: string) {
    return extractData<Reservation>(await api.patch(`/v1/reservations/${id}/confirm`));
  },

  /** Asigna una mesa física a la reserva; pasar tableId undefined la desasigna. */
  async assignTable(id: string, tableId?: string) {
    return extractData<Reservation>(
      await api.patch(`/v1/reservations/${id}/table`, null, { params: { tableId } })
    );
  },

  async cancel(id: string, reason?: string) {
    return extractData<Reservation>(
      await api.patch(`/v1/reservations/${id}/cancel`, null, { params: { reason } })
    );
  },

  async complete(id: string) {
    return extractData<Reservation>(await api.patch(`/v1/reservations/${id}/complete`));
  },

  async markNoShow(id: string) {
    return extractData<Reservation>(await api.patch(`/v1/reservations/${id}/no-show`));
  },

  async arriveByCode(code: string) {
    return extractData<Reservation>(await api.patch(`/v1/reservations/code/${code}/arrive`));
  },
};
