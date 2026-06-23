'use client';

import { Calendar, Heart, MapPin, Star, UtensilsCrossed, Wallet, Loader2 } from 'lucide-react';
import { useCustomerHistory } from '@/hooks/useCustomerHistory';
import { RestaurantLogo } from '@/components/ui/RestaurantLogo';
import { formatDate, formatTime, formatCurrency, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';

export function CustomerHistorySection() {
  const { data: history, isLoading } = useCustomerHistory(true);

  if (isLoading || !history) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 flex-shrink-0">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-gray-900">{history.restaurantesVisitados.length}</p>
            <p className="text-xs text-gray-500">Restaurantes visitados</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600 flex-shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-xl font-bold text-gray-900">{formatCurrency(history.gastoEstimado)}</p>
            <p className="text-xs text-gray-500">Gasto estimado</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 flex-shrink-0">
            <Heart className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-gray-900 truncate">
              {history.restauranteMasFrecuente?.name ?? 'Sin datos aún'}
            </p>
            <p className="text-xs text-gray-500">Restaurante favorito</p>
          </div>
        </div>
      </div>

      {/* Cocina favorita */}
      {history.tiposCocinaFavoritos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Tu cocina favorita:</span>
          {history.tiposCocinaFavoritos.map((c) => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-medium">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Próximas reservas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-orange-500" /> Próximas reservas
        </h2>
        {history.proximasReservas.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No tienes reservas confirmadas próximamente.</p>
        ) : (
          <div className="space-y-2">
            {history.proximasReservas.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50 flex-wrap">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{r.restaurantName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(r.reservationDate)} · {formatTime(r.startTime)} · {r.partySize} pers.
                  </p>
                </div>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_LABELS[r.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restaurantes visitados */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" /> Restaurantes visitados
        </h2>
        {history.restaurantesVisitados.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aún no completaste ninguna reserva.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.restaurantesVisitados.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100">
                <RestaurantLogo name={r.name} logoUrl={r.logoUrl} className="h-10 w-10 rounded-lg text-sm font-bold" />
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{r.name}</p>
                  <p className="text-xs text-gray-500">{r.visitCount} visita{r.visitCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mis reseñas */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Star className="h-4 w-4 text-orange-500" /> Mis reseñas
        </h2>
        {history.misResenas.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Todavía no has dejado ninguna reseña.</p>
        ) : (
          <div className="space-y-4">
            {history.misResenas.map((r) => (
              <div key={r.id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-medium text-gray-900 text-sm">{r.restaurantName}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" /> {r.score}/5
                  </span>
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                {r.ownerReply && (
                  <div className="mt-2 ml-3 pl-3 border-l-2 border-orange-200">
                    <p className="text-xs text-gray-400 mb-0.5">Respuesta del dueño</p>
                    <p className="text-sm text-gray-600">{r.ownerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
