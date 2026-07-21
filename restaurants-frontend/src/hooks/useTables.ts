import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { RestaurantTable } from '@/types/restaurant';

export function useTables(restaurantId?: string) {
  const qc = useQueryClient();

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: async () => {
      const res = await api.get(`/v1/restaurants/${restaurantId}/tables`);
      return res.data.data as RestaurantTable[];
    },
    enabled: !!restaurantId,
    refetchInterval: 10000, // Refrescar cada 10s para ver cambios en vivo
  });

  const updateStatus = useMutation({
    mutationFn: async ({ tableId, status }: { tableId: string; status: string }) => {
      const res = await api.patch(`/v1/restaurants/${restaurantId}/tables/${tableId}/status`, null, {
        params: { status }
      });
      return res.data.data as RestaurantTable;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
    },
  });

  return { tables, isLoading, updateStatus };
}
