'use client';

import { useQuery } from '@tanstack/react-query';
import { Tag } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { PromoFlyer } from '@/components/ui/PromoFlyer';
import type { Promotion } from '@/types/restaurant';

export function PromotionsSection({ restaurantId, restaurantName }: { restaurantId: string; restaurantName?: string }) {
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'active', restaurantId],
    queryFn: () => restaurantService.getActivePromotions(restaurantId),
    enabled: !!restaurantId,
  });

  if (!promotions || promotions.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-orange-500" /> Promociones
      </h2>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 150px))' }}>
        {promotions.map((promo: Promotion) => (
          <PromoFlyer key={promo.id} promo={{ ...promo, restaurantName }} />
        ))}
      </div>
    </div>
  );
}
