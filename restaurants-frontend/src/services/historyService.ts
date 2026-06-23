import { api, extractData } from './api';
import type { CustomerHistory } from '@/types/history';

export const historyService = {
  async getMyHistory() {
    return extractData<CustomerHistory>(await api.get('/v1/users/me/history'));
  },
};
