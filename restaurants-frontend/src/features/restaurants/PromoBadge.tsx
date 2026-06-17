'use client';

import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';

// Badge "promo" para la tarjeta del listado. Reutiliza la misma queryKey que la
// sección pública (cache compartida) y staleTime alto para no recargar al navegar.
export function PromoBadge({ restaurantId }: { restaurantId: string }) {
  const { data } = useQuery({
    queryKey: ['promotions', 'active', restaurantId],
    queryFn: () => restaurantService.getActivePromotions(restaurantId),
    enabled: !!restaurantId,
    staleTime: 5 * 60 * 1000,
  });

  if (!data || data.length === 0) return null;

  return (
    <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500 text-white shadow-md">
      <Tag className="h-3 w-3" />
      {data.length === 1 ? '1 promo' : `${data.length} promos`}
    </span>
  );
}
