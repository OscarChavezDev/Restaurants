import { api, extractData } from './api';

export interface ReservationConfig {
  minAdvanceHours: number;
  cancellationDeadlineHours: number;
  personsPerTable: number;
  requiresAdvancePayment: boolean;
  smallGroupMaxPersons: number;
  smallGroupAdvanceType: 'CHEAPEST_DISH' | 'FIXED_AMOUNT';
  smallGroupFixedAmount: number;
  largeGroupAdvancePercent: number;
  termsAndConditions?: string;
  paymentInfo?: string;
  paymentQrUrl?: string;
  allowSectionSelection: boolean;
  cheapestDishPrice?: number;
}

export const reservationConfigService = {
  async get(restaurantId: string) {
    return extractData<ReservationConfig>(await api.get(`/v1/restaurants/${restaurantId}/reservation-config`));
  },
  async update(restaurantId: string, data: ReservationConfig) {
    return extractData<ReservationConfig>(await api.put(`/v1/restaurants/${restaurantId}/reservation-config`, data));
  },
};

/** Estima el adelanto en el cliente con la misma fórmula del backend. */
export function estimateAdvance(cfg: ReservationConfig, partySize: number): number {
  if (!cfg.requiresAdvancePayment) return 0;
  const cheapest = cfg.cheapestDishPrice ?? 0;
  if (partySize <= cfg.smallGroupMaxPersons) {
    return cfg.smallGroupAdvanceType === 'FIXED_AMOUNT' ? Number(cfg.smallGroupFixedAmount || 0) : cheapest;
  }
  return +(cheapest * partySize * (cfg.largeGroupAdvancePercent / 100)).toFixed(2);
}

export function estimateTables(cfg: ReservationConfig, partySize: number): number {
  return Math.ceil(partySize / Math.max(1, cfg.personsPerTable));
}
