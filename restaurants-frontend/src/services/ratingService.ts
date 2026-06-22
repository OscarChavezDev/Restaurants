import { api } from './api';

export interface CreateRatingRequest {
  reservationId: string;
  score: number;
  comment?: string;
  foodScore?: number;
  serviceScore?: number;
  ambianceScore?: number;
}

export const ratingService = {
  createRating: async (request: CreateRatingRequest) => {
    const response = await api.post('/v1/ratings', request);
    return response.data;
  },
  // Respuesta del dueño a una reseña (texto vacío = elimina la respuesta).
  reply: async (ratingId: string, reply: string) => {
    const response = await api.patch(`/v1/ratings/${ratingId}/reply`, { reply });
    return response.data;
  },
};
