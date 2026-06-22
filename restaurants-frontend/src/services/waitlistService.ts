import { api, extractData } from './api';

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  customerName: string;
  customerPhone?: string;
  reservationDate: string;
  startTime?: string;
  partySize: number;
  status: string;
  createdAt: string;
}

export interface WaitlistJoinDto {
  restaurantId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  reservationDate: string;
  startTime?: string;
  partySize: number;
}

export const waitlistService = {
  async join(data: WaitlistJoinDto) {
    return extractData<WaitlistEntry>(await api.post('/v1/waitlist', data));
  },
  async byRestaurant(restaurantId: string) {
    return extractData<WaitlistEntry[]>(await api.get(`/v1/waitlist/restaurant/${restaurantId}`));
  },
  async cancel(id: string) {
    return api.delete(`/v1/waitlist/${id}`);
  },
};
