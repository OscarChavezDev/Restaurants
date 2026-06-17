'use client';

import { useState } from 'react';
import { Star, BadgeCheck, Loader2, ChevronDown } from 'lucide-react';
import { useRestaurantRatings, useRatingStats } from '@/hooks/useRestaurants';
import { cn } from '@/utils/cn';

function StarRow({ label, value }: { label: string; value?: number }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <div className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-gray-700">{value.toFixed(1)}</span>
      </div>
    </div>
  );
}

function DistributionBar({ score, count, total }: { score: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-4 text-right text-gray-500">{score}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-gray-400">{count}</span>
    </div>
  );
}

function RatingCard({ rating }: { rating: any }) {
  return (
    <div className="py-4 border-b border-gray-50 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold text-sm flex-shrink-0">
            {rating.userName?.charAt(0)?.toUpperCase() ?? 'V'}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-800">{rating.userName ?? 'Visitante'}</span>
              {rating.isVerified && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full font-medium">
                  <BadgeCheck className="h-3 w-3" /> Verificado
                </span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {new Date(rating.createdAt).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {[1, 2, 3, 4, 5].map(i => (
            <Star key={i} className={cn('h-3.5 w-3.5', i <= rating.score ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')} />
          ))}
        </div>
      </div>
      {rating.comment && (
        <p className="text-sm text-gray-600 mt-2 leading-relaxed">{rating.comment}</p>
      )}
      {(rating.foodScore || rating.serviceScore || rating.ambianceScore) && (
        <div className="flex gap-3 mt-2 flex-wrap">
          {rating.foodScore && <span className="text-xs text-gray-400">Comida: <strong>{rating.foodScore}/5</strong></span>}
          {rating.serviceScore && <span className="text-xs text-gray-400">Servicio: <strong>{rating.serviceScore}/5</strong></span>}
          {rating.ambianceScore && <span className="text-xs text-gray-400">Ambiente: <strong>{rating.ambianceScore}/5</strong></span>}
        </div>
      )}
    </div>
  );
}

export function RatingsSection({ restaurantId }: { restaurantId: string }) {
  const [page, setPage] = useState(0);
  const { data: stats, isLoading: statsLoading } = useRatingStats(restaurantId);
  const { data: ratingsPage, isLoading: ratingsLoading } = useRestaurantRatings(restaurantId, page);

  if (statsLoading) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="h-6 w-32 skeleton rounded mb-4" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  if (!stats || stats.totalRatings === 0) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 text-center">
      <Star className="h-10 w-10 text-gray-200 mx-auto mb-2" />
      <p className="text-sm text-gray-400">Aún no hay reseñas para este restaurante.</p>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-5 flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" /> Reseñas
      </h2>

      {/* Resumen */}
      <div className="flex gap-6 mb-6">
        <div className="text-center flex-shrink-0">
          <div className="text-5xl font-bold text-gray-900 dark:text-gray-50">{stats.avgScore.toFixed(1)}</div>
          <div className="flex justify-center mt-1 mb-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className={cn('h-4 w-4', i <= Math.round(stats.avgScore) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200')} />
            ))}
          </div>
          <div className="text-xs text-gray-400">{stats.totalRatings} reseñas</div>
        </div>

        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map(s => (
            <DistributionBar
              key={s}
              score={s}
              count={stats.distribution?.[s] ?? 0}
              total={stats.totalRatings}
            />
          ))}
        </div>
      </div>

      {/* Subcategorías */}
      {(stats.avgFoodScore || stats.avgServiceScore || stats.avgAmbianceScore) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StarRow label="Comida" value={stats.avgFoodScore} />
          <StarRow label="Servicio" value={stats.avgServiceScore} />
          <StarRow label="Ambiente" value={stats.avgAmbianceScore} />
        </div>
      )}

      {/* Lista de reseñas */}
      {ratingsLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
        </div>
      ) : (
        <>
          <div>
            {ratingsPage?.content.map(r => <RatingCard key={r.id} rating={r} />)}
          </div>

          {ratingsPage && !ratingsPage.last && (
            <button
              onClick={() => setPage(p => p + 1)}
              className="mt-4 w-full flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors"
            >
              <ChevronDown className="h-4 w-4" /> Ver más reseñas
            </button>
          )}
        </>
      )}
    </div>
  );
}
