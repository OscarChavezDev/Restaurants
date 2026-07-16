'use client';

import { useQuery } from '@tanstack/react-query';
import { BedDouble, MapPin, ExternalLink, Tag } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { formatCurrency } from '@/utils/formatters';
import type { NearbyLodging } from '@/types/restaurant';

const TYPE_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  hostal: 'Hostal',
  casa_departamento: 'Casa / Apto.',
  albergue: 'Albergue',
  resort: 'Resort',
};

const TYPE_GRADIENT: Record<string, string> = {
  hotel: 'from-blue-600 to-indigo-700',
  hostal: 'from-teal-500 to-emerald-700',
  resort: 'from-pink-500 to-rose-700',
  casa_departamento: 'from-amber-500 to-orange-600',
};

/** Sistema de Hospedaje (Hospy): hospedajes cerca de este restaurante. */
export function NearbyLodgingSection({ restaurantId }: { restaurantId: string }) {
  const { data: lodgings } = useQuery({
    queryKey: ['nearby-lodging', restaurantId],
    queryFn: () => restaurantService.getNearbyLodging(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });

  if (!lodgings || lodgings.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">

      {/* Header con badge de integración */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-teal-50/80 dark:bg-teal-900/20">
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-teal-600 dark:text-teal-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Dónde hospedarte cerca
          </h2>
        </div>
        <span className="text-[10px] font-bold tracking-wide uppercase text-teal-700 dark:text-teal-300 bg-teal-100 dark:bg-teal-500/25 px-2 py-0.5 rounded-full ring-1 ring-teal-200 dark:ring-teal-500/30">
          Hospy
        </span>
      </div>

      {/* Tarjetas */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {lodgings.slice(0, 4).map((l: NearbyLodging) => (
          <div
            key={l.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
          >
            {/* Imagen / placeholder */}
            <div className="relative h-16 w-16 shrink-0 rounded-xl overflow-hidden shadow-sm">
              {l.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={l.photoUrl}
                  alt={l.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className={`h-full w-full bg-gradient-to-br ${TYPE_GRADIENT[l.type ?? ''] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center`}>
                  <BedDouble className="h-7 w-7 text-white/80" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight truncate">
                  {l.name}
                </h3>
                {l.type && (
                  <span className="shrink-0 text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-500/10 px-1.5 py-0.5 rounded-md whitespace-nowrap">
                    {TYPE_LABEL[l.type] ?? l.type}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                {l.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-teal-500" />
                    {l.city}
                  </span>
                )}
                {l.distanceKm != null && (
                  <span className="font-medium text-teal-600 dark:text-teal-400">
                    {l.distanceKm.toFixed(1)} km
                  </span>
                )}
              </div>

              {l.priceFrom != null && (
                <p className="text-xs">
                  <span className="text-gray-400 dark:text-gray-500">Desde </span>
                  <span className="font-bold text-orange-600 dark:text-orange-400">
                    {formatCurrency(l.priceFrom)}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500"> /noche</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/30">
        <a
          href="https://hospy.pages.dev"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          <Tag className="h-3 w-3" />
          Ver todos los hospedajes en Hospy
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
