'use client';

import { useQuery } from '@tanstack/react-query';
import { BedDouble, MapPin } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { formatCurrency } from '@/utils/formatters';
import type { NearbyLodging } from '@/types/restaurant';

/** Sistema de Hospedaje (Hospy): hospedajes cerca de este restaurante. No renderiza nada si no hay resultados. */
export function NearbyLodgingSection({ restaurantId }: { restaurantId: string }) {
  const { data: lodgings } = useQuery({
    queryKey: ['nearby-lodging', restaurantId],
    queryFn: () => restaurantService.getNearbyLodging(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });

  if (!lodgings || lodgings.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <h2 className="font-display text-base font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <BedDouble className="h-4.5 w-4.5 text-orange-500" /> Dónde hospedarte cerca
      </h2>
      <div className="space-y-2.5">
        {lodgings.slice(0, 4).map((l: NearbyLodging) => (
          <div key={l.id} className="flex items-center gap-3 rounded-xl border border-gray-100 dark:border-gray-700 p-2.5">
            {l.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={l.photoUrl} alt={l.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                <BedDouble className="h-5 w-5 text-gray-300" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{l.name}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                {l.distanceKm != null && (
                  <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{l.distanceKm.toFixed(1)} km</span>
                )}
                {l.priceFrom != null && <span>Desde {formatCurrency(l.priceFrom)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
