import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import type { CreateRestaurantDto } from '@/types/restaurant';

export const RESTAURANT_KEYS = {
  all: ['restaurants'] as const,
  lists: () => [...RESTAURANT_KEYS.all, 'list'] as const,
  list: (filters: object) => [...RESTAURANT_KEYS.lists(), filters] as const,
  detail: (id: string) => [...RESTAURANT_KEYS.all, 'detail', id] as const,
  slug: (slug: string) => [...RESTAURANT_KEYS.all, 'slug', slug] as const,
  nearby: (lat: number, lon: number, r: number) => [...RESTAURANT_KEYS.all, 'nearby', lat, lon, r] as const,
  mine: () => [...RESTAURANT_KEYS.all, 'mine'] as const,
  menus: (restaurantId: string) => [...RESTAURANT_KEYS.all, 'menus', restaurantId] as const,
  dishes: (menuId: string) => [...RESTAURANT_KEYS.all, 'dishes', menuId] as const,
  images: (restaurantId: string) => [...RESTAURANT_KEYS.all, 'images', restaurantId] as const,
  ratings: (restaurantId: string, page: number) => [...RESTAURANT_KEYS.all, 'ratings', restaurantId, page] as const,
  ratingStats: (restaurantId: string) => [...RESTAURANT_KEYS.all, 'ratingStats', restaurantId] as const,
};

export function useRestaurants(page = 0, size = 12) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.list({ page, size }),
    queryFn: () => restaurantService.getAll(page, size),
    staleTime: 1000 * 60 * 5,
  });
}

export function useRestaurant(id: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.detail(id),
    queryFn: () => restaurantService.getById(id),
    enabled: !!id,
  });
}

export function useRestaurantBySlug(slug: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.slug(slug),
    queryFn: () => restaurantService.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useSearchRestaurants(params: {
  name?: string;
  city?: string;
  category?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.list(params),
    queryFn: () => restaurantService.search(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useNearbyRestaurants(lat: number, lon: number, radiusKm = 5) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.nearby(lat, lon, radiusKm),
    queryFn: () => restaurantService.getNearby(lat, lon, radiusKm),
    enabled: !!lat && !!lon,
    staleTime: 1000 * 60 * 3,
  });
}

export function useMyRestaurants() {
  return useQuery({
    queryKey: RESTAURANT_KEYS.mine(),
    queryFn: () => restaurantService.getMyRestaurants(),
  });
}

export function useCreateRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRestaurantDto) => restaurantService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.all });
    },
  });
}

export function useDeleteRestaurant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restaurantService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESTAURANT_KEYS.all });
    },
  });
}

export function useRestaurantMenus(restaurantId: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.menus(restaurantId),
    queryFn: () => restaurantService.getMenus(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useMenuDishes(menuId: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.dishes(menuId),
    queryFn: () => restaurantService.getDishes(menuId),
    enabled: !!menuId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useRestaurantImages(restaurantId: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.images(restaurantId),
    queryFn: () => restaurantService.getImages(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 10,
  });
}

export function useRestaurantRatings(restaurantId: string, page = 0) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.ratings(restaurantId, page),
    queryFn: () => restaurantService.getRatings(restaurantId, page),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useRatingStats(restaurantId: string) {
  return useQuery({
    queryKey: RESTAURANT_KEYS.ratingStats(restaurantId),
    queryFn: () => restaurantService.getRatingStats(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });
}
