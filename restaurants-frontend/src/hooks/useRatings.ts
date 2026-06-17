import { useState } from 'react';
import { ratingService, CreateRatingRequest } from '../services/ratingService';

export const useRatings = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRating = async (request: CreateRatingRequest) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ratingService.createRating(request);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al crear la reseña');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createRating, loading, error };
};
