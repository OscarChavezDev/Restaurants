'use client';

import { useQuery } from '@tanstack/react-query';
import { PartyPopper, Calendar, Ticket, ExternalLink, Tag, Clock } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import type { NearbyEvent } from '@/types/restaurant';

const CATEGORY_GRADIENT: Record<string, string> = {
  música: 'from-purple-500 to-violet-700',
  música_en_vivo: 'from-purple-500 to-violet-700',
  gastronomía: 'from-orange-400 to-red-600',
  deporte: 'from-green-500 to-emerald-700',
  cultura: 'from-blue-500 to-indigo-700',
  festival: 'from-pink-500 to-rose-700',
  feria: 'from-amber-400 to-yellow-600',
};

function eventGradient(category?: string) {
  if (!category) return 'from-slate-500 to-slate-700';
  const key = category.toLowerCase().replace(/\s+/g, '_');
  return CATEGORY_GRADIENT[key] ?? 'from-indigo-500 to-purple-700';
}

function formatEventDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('es-PE', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
  } catch {
    return iso;
  }
}

function formatEventTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/** Sistema de Eventos (Actify): eventos cerca de este restaurante. */
export function NearbyEventsSection({ restaurantId }: { restaurantId: string }) {
  const { data: events } = useQuery({
    queryKey: ['nearby-events', restaurantId],
    queryFn: () => restaurantService.getNearbyEvents(restaurantId),
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  });

  if (!events || events.length === 0) return null;

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">

      {/* Header con badge de integración */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700/60 bg-purple-50/80 dark:bg-purple-900/20">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Eventos cerca de acá
          </h2>
        </div>
        <span className="text-[10px] font-bold tracking-wide uppercase text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/25 px-2 py-0.5 rounded-full ring-1 ring-purple-200 dark:ring-purple-500/30">
          Actify
        </span>
      </div>

      {/* Tarjetas de eventos */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {events.slice(0, 4).map((e: NearbyEvent) => (
          <div
            key={e.id}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors group"
          >
            {/* Avatar de categoría */}
            <div className={`h-16 w-16 shrink-0 rounded-xl bg-gradient-to-br ${eventGradient(e.category)} flex flex-col items-center justify-center shadow-sm`}>
              <PartyPopper className="h-6 w-6 text-white/90" />
              {e.category && (
                <span className="mt-0.5 text-[9px] font-semibold text-white/80 text-center leading-tight px-1 truncate max-w-full">
                  {e.category}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2">
                  {e.name}
                </h3>
                {e.soldOut && (
                  <span className="shrink-0 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-md">
                    Agotado
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-purple-500" />
                  {formatEventDate(e.startDate)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatEventTime(e.startDate)}
                </span>
              </div>

              {!e.soldOut && e.availableSpots != null && (
                <p className="text-xs flex items-center gap-1">
                  <Ticket className="h-3 w-3 text-purple-500" />
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {e.availableSpots} cupos disponibles
                  </span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/80 dark:bg-gray-900/30">
        <a
          href="https://actify.qd.je"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          <Tag className="h-3 w-3" />
          Ver todos los eventos en Actify
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
