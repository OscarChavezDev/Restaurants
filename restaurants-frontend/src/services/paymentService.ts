import { api, extractData } from './api';

export interface Payment {
  id: string;
  reservationId: string;
  confirmationCode?: string;
  customerName?: string;
  reservationDate?: string;
  amount: number;
  method: string;
  status: string; // SUBMITTED | VERIFIED | REJECTED
  proofImageUrl?: string;
  createdAt: string;
  verifiedAt?: string;
}

export interface PaymentProofDto {
  reservationId: string;
  amount: number;
  method: string;
  proofImageUrl: string;
}

export const paymentService = {
  async submitProof(data: PaymentProofDto) {
    return extractData<Payment>(await api.post('/v1/payments/proof', data));
  },
  async byRestaurant(restaurantId: string) {
    return extractData<Payment[]>(await api.get(`/v1/payments/restaurant/${restaurantId}`));
  },
  async verify(id: string) {
    return extractData<Payment>(await api.patch(`/v1/payments/${id}/verify`));
  },
  async reject(id: string) {
    return extractData<Payment>(await api.patch(`/v1/payments/${id}/reject`));
  },
};
