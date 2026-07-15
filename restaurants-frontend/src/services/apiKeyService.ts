import { api, extractData } from './api';

export interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
  revoked: boolean;
}

export interface ApiKeyCreatedDto extends Omit<ApiKeyDto, 'revoked'> {
  rawKey: string;
}

export const apiKeyService = {
  async list() {
    return extractData<ApiKeyDto[]>(await api.get('/v1/developer/api-keys'));
  },

  async generate(name: string) {
    return extractData<ApiKeyCreatedDto>(await api.post('/v1/developer/api-keys', { name }));
  },

  async revoke(id: string) {
    return extractData<void>(await api.delete(`/v1/developer/api-keys/${id}`));
  },

  /** Revoca la clave actual y crea una nueva con el mismo nombre — el valor real no se puede recuperar. */
  async regenerate(id: string) {
    return extractData<ApiKeyCreatedDto>(await api.post(`/v1/developer/api-keys/${id}/regenerate`));
  },
};
