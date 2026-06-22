import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { reservationService } from '@/services/reservationService';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import type { CreateReservationDto, Reservation } from '@/types/reservation';

export const RESERVATION_KEYS = {
  all: ['reservations'] as const,
  mine: () => [...RESERVATION_KEYS.all, 'mine'] as const,
  restaurant: (id: string) => [...RESERVATION_KEYS.all, 'restaurant', id] as const,
  code: (code: string) => [...RESERVATION_KEYS.all, 'code', code] as const,
};

/**
 * Reservas de los restaurantes que administra el usuario:
 * - OWNER: las de sus restaurantes
 * - ADMIN: las de todos los restaurantes del sistema
 * Agrega vía el mismo endpoint por-restaurante que usa la lista de reservas,
 * de modo que los conteos siempre coinciden con esa vista.
 */
export function useManagedReservations() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: mine } = useMyRestaurants();
  const { data: all } = useRestaurants(0, 100);
  const list = isAdmin ? all : mine;
  const ids = list?.content.map((r) => r.id) ?? [];

  const queries = useQueries({
    queries: ids.map((id) => ({
      queryKey: [...RESERVATION_KEYS.restaurant(id), 'agg'] as const,
      queryFn: () => reservationService.getByRestaurant(id, 0, 200),
      enabled: !!id,
      staleTime: 1000 * 60,
    })),
  });

  const reservations: Reservation[] = queries.flatMap((q) => q.data?.content ?? []);
  const isLoading = ids.length > 0 && queries.some((q) => q.isLoading);

  return { reservations, isLoading };
}

export function useMyReservations(page = 0, size = 10) {
  return useQuery({
    queryKey: RESERVATION_KEYS.mine(),
    queryFn: () => reservationService.getMyReservations(page, size),
  });
}

export function useRestaurantReservations(restaurantId: string, page = 0, size = 20) {
  return useQuery({
    queryKey: RESERVATION_KEYS.restaurant(restaurantId),
    queryFn: () => reservationService.getByRestaurant(restaurantId, page, size),
    enabled: !!restaurantId,
  });
}

export function useReservationByCode(code: string) {
  return useQuery({
    queryKey: RESERVATION_KEYS.code(code),
    queryFn: () => reservationService.getByCode(code),
    enabled: !!code,
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReservationDto) => reservationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.all });
    },
  });
}

export function useConfirmReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationService.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.all });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      reservationService.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.all });
    },
  });
}

export function useCompleteReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationService.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.all });
    },
  });
}

export function useNoShowReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reservationService.markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESERVATION_KEYS.all });
    },
  });
}
