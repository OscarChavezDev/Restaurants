import { useQuery } from '@tanstack/react-query';
import { historyService } from '@/services/historyService';

export function useCustomerHistory(enabled: boolean) {
  return useQuery({
    queryKey: ['history', 'me'],
    queryFn: () => historyService.getMyHistory(),
    enabled,
    staleTime: 1000 * 60,
  });
}
