'use client';

import { useQuery } from '@tanstack/react-query';
import { PartyPopper, Ticket, ExternalLink } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import type { NearbyEvent } from '@/types/restaurant';

function formatEventDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

/** Sistema de Eventos (Actify): eventos cerca de este restaurante. No renderiza nada si no hay resultados. */
export function NearbyEventsSection({ restaurantId }: { restaurantId: string }) {
  const { data: events } = useQuery({
    queryKey: ['nearby-events', restaurantId],
    queryFn: () => restaurantService.getNearbyEvents(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });

  if (!events || events.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <h2 className="font-display text-base font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <PartyPopper className="h-4.5 w-4.5 text-orange-500" /> Eventos cerca de acá
      </h2>
      <div className="space-y-2.5">
        {events.slice(0, 4).map((e: NearbyEvent) => (
          <div key={e.id} className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{e.name}</h3>
              <span className="shrink-0 text-[11px] font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full">
                {formatEventDate(e.startDate)}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              {e.category && <span>{e.category}</span>}
              <span className="flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                {e.soldOut ? 'Agotado' : e.availableSpots != null ? `${e.availableSpots} cupos` : 'Cupos disponibles'}
              </span>
            </div>
          </div>
        ))}
      </div>
      <a
        href="https://actify.qd.je"
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:text-orange-700 transition-colors"
      >
        Ver todos los eventos en Actify <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
