import { api, extractData } from './api';

export interface PendingRestaurant {
  id: string;
  name: string;
  description?: string;
  address?: string;
  district?: string;
  city?: string;
  region?: string;
  phone?: string;
  email?: string;
  ruc?: string;
  totalCapacity?: number;
  priceLevel?: number;
  status?: string;
}

export interface RegistrationRequest {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  accountStatus: string;
  requestedAt: string;
  restaurants: PendingRestaurant[];
}

export const adminRegistrationService = {
  async listPending() {
    return extractData<RegistrationRequest[]>(await api.get('/v1/admin/registration-requests'));
  },
  async approve(userId: string) {
    return extractData<void>(await api.post(`/v1/admin/registration-requests/${userId}/approve`));
  },
  async reject(userId: string, reason?: string) {
    return extractData<void>(await api.post(`/v1/admin/registration-requests/${userId}/reject`, { reason }));
  },
};
