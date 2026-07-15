import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiKeyService } from '@/services/apiKeyService';

export const API_KEY_KEYS = {
  all: ['apiKeys'] as const,
  list: () => [...API_KEY_KEYS.all, 'list'] as const,
};

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEY_KEYS.list(),
    queryFn: () => apiKeyService.list(),
  });
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => apiKeyService.generate(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeyService.revoke(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
    },
  });
}

export function useRegenerateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiKeyService.regenerate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: API_KEY_KEYS.all });
    },
  });
}
