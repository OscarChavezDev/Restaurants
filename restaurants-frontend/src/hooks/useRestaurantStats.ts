import { useQuery } from '@tanstack/react-query';
import { statsService } from '@/services/statsService';
import type { RestaurantStatsParams } from '@/types/stats';

export function useRestaurantStats(restaurantId: string | undefined, params: RestaurantStatsParams) {
  return useQuery({
    queryKey: ['stats', restaurantId, params],
    queryFn: () => statsService.getRestaurantStats(restaurantId!, params),
    enabled: !!restaurantId,
    staleTime: 1000 * 60,
  });
}
