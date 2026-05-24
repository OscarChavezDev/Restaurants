'use client';

import { Plus, ExternalLink, Calendar, Star, Users, CheckCircle, XCircle, Clock, UtensilsCrossed } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/services/api';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { Restaurant, RestaurantStatus } from '@/types/restaurant';
import type { PagedResponse } from '@/types/auth';

export default function RestaurantsPage() {
  const isAdmin = useAuthStore(s => s.isAdmin());
  const [filterStatus, setFilterStatus] = useState<string>('');
  const qc = useQueryClient();

  // Admin ve TODOS los restaurantes del sistema
  const { data: adminData, isLoading: adminLoading } = useQuery({
    queryKey: ['restaurants', 'admin', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '0', size: '50' });
      if (filterStatus) params.append('status', filterStatus);
      const r = await api.get(`/v1/restaurants/admin/all?${params}`);
      return r.data.data as PagedResponse<Restaurant>;
    },
    enabled: isAdmin,
  });

  // Owner ve solo los suyos
  const { data: ownerData, isLoading: ownerLoading } = useMyRestaurants();

  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/v1/restaurants/${id}/status`, null, { params: { status } }),
    onSuccess: (_, { status }) => {
      qc.invalidateQueries({ queryKey: ['restaurants'] });
      toast.success(status === 'ACTIVE' ? 'Restaurante aprobado' : 'Restaurante desactivado');
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const restaurants = isAdmin ? adminData?.content : ownerData?.content;
  const total = isAdmin ? adminData?.totalElements : ownerData?.totalElements;
  const isLoading = isAdmin ? adminLoading : ownerLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">
            {isAdmin ? 'Todos los Restaurantes' : 'Mis Restaurantes'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Aprueba o rechaza restaurantes del sistema' : 'Gestiona tu portafolio de restaurantes'}
          </p>
        </div>
        {!isAdmin && (
          <Link href="/dashboard/restaurants/new"
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors">
            <Plus className="h-4 w-4" /> Nuevo Restaurante
          </Link>
        )}
      </div>

      {/* Filtro por estado — solo admin */}
      {isAdmin && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="text-sm text-gray-500">Filtrar:</span>
          {['', 'PENDING_APPROVAL', 'ACTIVE', 'INACTIVE'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium border transition-colors', {
                'bg-orange-500 text-white border-orange-500': filterStatus === s,
                'bg-white text-gray-600 border-gray-200 hover:border-orange-300': filterStatus !== s,
              })}>
              {s === '' ? 'Todos' : STATUS_LABELS[s] ?? s}
            </button>
          ))}
          <span className="text-sm text-gray-400 ml-2">Total: <strong className="text-gray-700">{total ?? 0}</strong></span>
        </div>
      )}

      {!isAdmin && total !== undefined && (
        <p className="text-sm text-gray-500 mb-5">Total: <strong className="text-gray-900">{total}</strong> restaurantes</p>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : !restaurants?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <UtensilsCrossed className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
            {isAdmin ? 'No hay restaurantes con este filtro' : 'Sin restaurantes aún'}
          </h3>
          {!isAdmin && (
            <Link href="/dashboard/restaurants/new"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-3 font-semibold text-white mt-4">
              <Plus className="h-4 w-4" /> Crear restaurante
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map(r => (
            <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
              {/* Avatar */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-100 text-orange-500 font-display font-bold text-xl flex-shrink-0">
                {r.name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-semibold text-gray-900 truncate">{r.name}</h3>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', STATUS_COLORS[r.status])}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{r.address}, {r.city}</p>
                <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-400" />{r.avgRating.toFixed(1)}</span>
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.totalCapacity} personas</span>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                {/* Botones de aprobación — solo ADMIN */}
                {isAdmin && r.status === 'PENDING_APPROVAL' && (
                  <>
                    <button onClick={() => changeStatus.mutate({ id: r.id, status: 'ACTIVE' })}
                      disabled={changeStatus.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors">
                      <CheckCircle className="h-3.5 w-3.5" /> Aprobar
                    </button>
                    <button onClick={() => changeStatus.mutate({ id: r.id, status: 'INACTIVE' })}
                      disabled={changeStatus.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-xs font-semibold rounded-xl transition-colors">
                      <XCircle className="h-3.5 w-3.5" /> Rechazar
                    </button>
                  </>
                )}
                {isAdmin && r.status === 'ACTIVE' && (
                  <button onClick={() => changeStatus.mutate({ id: r.id, status: 'INACTIVE' })}
                    disabled={changeStatus.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 disabled:opacity-60 text-white text-xs font-medium rounded-xl transition-colors">
                    <XCircle className="h-3.5 w-3.5" /> Desactivar
                  </button>
                )}
                {isAdmin && r.status === 'INACTIVE' && (
                  <button onClick={() => changeStatus.mutate({ id: r.id, status: 'ACTIVE' })}
                    disabled={changeStatus.isPending}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-medium rounded-xl transition-colors">
                    <CheckCircle className="h-3.5 w-3.5" /> Activar
                  </button>
                )}

                <Link href={`/restaurants/${r.slug}`} target="_blank"
                  className="p-2 rounded-xl text-gray-400 hover:text-orange-500 hover:bg-orange-50 transition-colors" title="Ver página pública">
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link href={`/dashboard/restaurants/${r.id}`}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-orange-50 text-gray-700 hover:text-orange-600 text-sm font-medium transition-colors flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Gestionar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
