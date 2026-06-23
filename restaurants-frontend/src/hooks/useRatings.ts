import { useState, useCallback } from 'react';
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
      setError(err.response?.data?.message || 'Error al enviar calificación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMyRatings = useCallback(async (page = 0, size = 10) => {
    try {
      setLoading(true);
      setError(null);
      const data = await ratingService.getMyRatings(page, size);
      return data;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al obtener reseñas');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createRating, getMyRatings, loading, error };
};
