export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Reservation {
  id: string;
  restaurantId: string;
  restaurantName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  reservationDate: string;
  startTime: string;
  endTime?: string;
  partySize: number;
  tableId?: string;
  sectionId?: string;
  status: ReservationStatus;
  advanceAmount?: number;
  paymentStatus?: string;
  notes?: string;
  specialRequests?: string;
  confirmationCode: string;
  isEventRelated: boolean;
  relatedEventName?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
}

export interface CreateReservationDto {
  restaurantId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  reservationDate: string;
  startTime: string;
  endTime?: string;
  partySize: number;
  sectionId?: string;
  termsAccepted?: boolean;
  orderItems?: { dishId: string; quantity: number }[];
  notes?: string;
  specialRequests?: string;
  relatedEventId?: string;
  relatedEventName?: string;
}
