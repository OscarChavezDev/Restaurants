import { api } from './api';

export const reportExportService = {
  async download(restaurantId: string, format: 'xlsx' | 'pdf', params: { from?: string; to?: string }) {
    const response = await api.get(`/v1/restaurants/${restaurantId}/reports/export`, {
      params: { ...params, format },
      responseType: 'blob',
    });
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${restaurantId}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
