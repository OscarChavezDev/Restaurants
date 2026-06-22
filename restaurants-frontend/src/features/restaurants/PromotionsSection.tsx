'use client';

import { useQuery } from '@tanstack/react-query';
import { Tag, Calendar } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { formatCurrency } from '@/utils/formatters';
import type { Promotion } from '@/types/restaurant';

const PROMO_LABELS: Record<string, string> = {
  PERCENTAGE_DISCOUNT: 'Descuento',
  FIXED_DISCOUNT: 'Descuento',
  COMBO: 'Combo',
  FREE_ITEM: 'Gratis',
  HAPPY_HOUR: 'Happy Hour',
};

export function PromotionsSection({ restaurantId }: { restaurantId: string }) {
  const { data: promotions } = useQuery({
    queryKey: ['promotions', 'active', restaurantId],
    queryFn: () => restaurantService.getActivePromotions(restaurantId),
    enabled: !!restaurantId,
  });

  if (!promotions || promotions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <Tag className="h-5 w-5 text-orange-500" /> Promociones
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {promotions.map((promo: Promotion) => (
          <div key={promo.id} className="rounded-xl border border-orange-100 dark:border-orange-500/20 bg-orange-50/60 dark:bg-orange-500/10 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500 text-white">
                {PROMO_LABELS[promo.promoType] ?? 'Promo'}
              </span>
              {promo.discountValue ? (
                <span className="text-base font-bold text-orange-600 dark:text-orange-400">
                  {promo.promoType === 'PERCENTAGE_DISCOUNT' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)}
                </span>
              ) : null}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{promo.title}</h3>
            {promo.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{promo.description}</p>}
            <div className="mt-2 flex items-center gap-3 flex-wrap">
              {promo.promoCode && (
                <code className="text-xs bg-white dark:bg-gray-700 border border-orange-200 dark:border-gray-600 px-2 py-0.5 rounded font-mono text-orange-700 dark:text-orange-300">
                  {promo.promoCode}
                </code>
              )}
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <Calendar className="h-3 w-3" />
                Hasta {new Date(promo.validUntil).toLocaleDateString('es-PE')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
