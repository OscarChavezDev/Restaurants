import { api } from './api';
import { RatingResponse } from '@/types/restaurant';
import { ApiResponse, PagedResponse } from '@/types/auth';

export interface CreateRatingRequest {
  reservationId?: string;
  restaurantId?: string;
  score: number;
  comment?: string;
  foodScore?: number;
  serviceScore?: number;
  ambianceScore?: number;
}

export const ratingService = {
  createRating: async (request: CreateRatingRequest) => {
    const { data } = await api.post<ApiResponse<RatingResponse>>('/v1/ratings', request);
    return data.data;
  },

  getMyRatings: async (page = 0, size = 10) => {
    const { data } = await api.get<ApiResponse<PagedResponse<RatingResponse>>>('/v1/ratings/me', {
      params: { page, size }
    });
    return data.data;
  },
  // Respuesta del dueño a una reseña (texto vacío = elimina la respuesta).
  reply: async (ratingId: string, reply: string) => {
    const response = await api.patch(`/v1/ratings/${ratingId}/reply`, { reply });
    return response.data;
  },
};
