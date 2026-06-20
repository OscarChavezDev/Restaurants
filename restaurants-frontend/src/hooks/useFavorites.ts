'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

/** Favoritos del cliente (S8-04). Devuelve el set de ids y un toggle. */
export function useFavorites() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => (await api.get('/v1/favorites')).data.data as string[],
    enabled: !!isAuthenticated,
    staleTime: 1000 * 60,
  });

  const ids = useMemo(() => new Set(data ?? []), [data]);

  const toggle = useMutation({
    mutationFn: async (restaurantId: string) => {
      if (ids.has(restaurantId)) await api.delete(`/v1/favorites/${restaurantId}`);
      else await api.post(`/v1/favorites/${restaurantId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return {
    ids,
    isFavorite: (id: string) => ids.has(id),
    toggle,
    isAuthenticated: !!isAuthenticated,
  };
}
