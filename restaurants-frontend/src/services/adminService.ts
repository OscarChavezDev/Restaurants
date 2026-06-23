import { api, extractData } from './api';
import type { SystemStats, AuditLog } from '@/types/admin';
import type { PagedResponse } from '@/types/auth';

export const adminService = {
  async getSystemStats(params: { from?: string; to?: string }) {
    return extractData<SystemStats>(await api.get('/v1/admin/system-stats', { params }));
  },

  async getAuditLogs(params: {
    entityType?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
  }) {
    return extractData<PagedResponse<AuditLog>>(await api.get('/v1/admin/audit-logs', { params }));
  },
};
