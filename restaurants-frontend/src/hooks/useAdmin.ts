import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/adminService';

export function useSystemStats(params: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['admin', 'system-stats', params],
    queryFn: () => adminService.getSystemStats(params),
    staleTime: 1000 * 60,
  });
}

export function useAuditLogs(params: {
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: () => adminService.getAuditLogs(params),
  });
}
