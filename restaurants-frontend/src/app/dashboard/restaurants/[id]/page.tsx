'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail, Users, Star, Calendar, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Pencil } from 'lucide-react';
import { useRestaurant, useDeleteRestaurant } from '@/hooks/useRestaurants';
import { useRestaurantReservations, useConfirmReservation, useCancelReservation } from '@/hooks/useReservations';
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { ScheduleEditor } from '@/components/ui/ScheduleEditor';
import { PhotoManager } from '@/components/ui/PhotoManager';
import { TablesManager } from '@/components/ui/TablesManager';
import toast from 'react-hot-toast';
import type { RestaurantStatus } from '@/types/restaurant';

export default function RestaurantDetailDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useAuthStore(s => s.isAdmin());
  const qc = useQueryClient();

  const { data: restaurant, isLoading } = useRestaurant(id);
  const { data: reservations } = useRestaurantReservations(id);
  const deleteMutation = useDeleteRestaurant();
  const confirmMutation = useConfirmReservation();
  const cancelMutation = useCancelReservation();

  const changeStatus = useMutation({
    mutationFn: (status: RestaurantStatus) =>
      api.patch(`/v1/restaurants/${id}/status`, null, { params: { status } }),
    onSuccess: (_, status) => {
      qc.invalidateQueries({ queryKey: ['restaurants', 'detail', id] });
      toast.success(`Restaurante ${status === 'ACTIVE' ? 'aprobado' : status === 'INACTIVE' ? 'desactivado' : 'actualizado'}`);
    },
    onError: () => toast.error('Error al cambiar el estado'),
  });

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este restaurante?')) return;
    await deleteMutation.mutateAsync(id);
    toast.success('Restaurante eliminado');
    router.push('/dashboard/restaurants');
  };

  if (isLoading) return (
    <div className="space-y-4">
      <div className="h-8 skeleton rounded-xl w-48" />
      <div className="h-48 skeleton rounded-2xl" />
    </div>
  );

  if (!restaurant) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Restaurante no encontrado</p>
      <Link href="/dashboard/restaurants" className="text-orange-500 hover:underline mt-2 block">Volver</Link>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/dashboard/restaurants" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">{restaurant.name}</h1>
            <p className="text-gray-400 text-sm font-mono">{restaurant.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/restaurants/${restaurant.slug}`} target="_blank"
            className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Ver página pública ↗
          </Link>
          <Link href={`/dashboard/restaurants/${id}/edit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">
            <Pencil className="h-4 w-4" /> Editar
          </Link>
          <button onClick={handleDelete} className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors" title="Eliminar restaurante">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* PANEL DE APROBACIÓN — solo ADMIN */}
      {isAdmin && (
        <div className={cn('rounded-2xl border p-5 mb-6', {
          'bg-yellow-50 border-yellow-200': restaurant.status === 'PENDING_APPROVAL',
          'bg-green-50 border-green-200': restaurant.status === 'ACTIVE',
          'bg-gray-50 border-gray-200': restaurant.status === 'INACTIVE' || restaurant.status === 'TEMPORARILY_CLOSED',
        })}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {restaurant.status === 'PENDING_APPROVAL' && <AlertCircle className="h-6 w-6 text-yellow-600" />}
              {restaurant.status === 'ACTIVE' && <CheckCircle className="h-6 w-6 text-green-600" />}
              {(restaurant.status === 'INACTIVE' || restaurant.status === 'TEMPORARILY_CLOSED') && <XCircle className="h-6 w-6 text-gray-500" />}
              <div>
                <p className="font-semibold text-gray-900">
                  {restaurant.status === 'PENDING_APPROVAL' && 'Este restaurante está pendiente de tu aprobación'}
                  {restaurant.status === 'ACTIVE' && 'Restaurante activo y visible al público'}
                  {restaurant.status === 'INACTIVE' && 'Restaurante desactivado'}
                  {restaurant.status === 'TEMPORARILY_CLOSED' && 'Restaurante cerrado temporalmente'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {restaurant.status === 'PENDING_APPROVAL' && 'Apruébalo para que aparezca en el catálogo público y los clientes puedan hacer reservas.'}
                  {restaurant.status === 'ACTIVE' && 'Aparece en /restaurants y acepta reservas.'}
                </p>
              </div>
            </div>

            {/* Botones de acción según estado */}
            <div className="flex gap-2 flex-wrap">
              {restaurant.status === 'PENDING_APPROVAL' && (
                <>
                  <button
                    onClick={() => changeStatus.mutate('ACTIVE')}
                    disabled={changeStatus.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprobar restaurante
                  </button>
                  <button
                    onClick={() => changeStatus.mutate('INACTIVE')}
                    disabled={changeStatus.isPending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-500 hover:bg-gray-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar
                  </button>
                </>
              )}
              {restaurant.status === 'ACTIVE' && (
                <button
                  onClick={() => changeStatus.mutate('INACTIVE')}
                  disabled={changeStatus.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
                >
                  <XCircle className="h-4 w-4" /> Desactivar
                </button>
              )}
              {(restaurant.status === 'INACTIVE' || restaurant.status === 'TEMPORARILY_CLOSED') && (
                <button
                  onClick={() => changeStatus.mutate('ACTIVE')}
                  disabled={changeStatus.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
                >
                  <CheckCircle className="h-4 w-4" /> Activar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-semibold text-gray-900">Información</h2>
              <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[restaurant.status])}>
                {STATUS_LABELS[restaurant.status]}
              </span>
            </div>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" /><span>{restaurant.address}, {restaurant.city}</span></div>
              {restaurant.phone && <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-orange-500" />{restaurant.phone}</div>}
              {restaurant.email && <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-orange-500" />{restaurant.email}</div>}
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-500" />Capacidad: <strong>{restaurant.totalCapacity}</strong> personas</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-yellow-400" />{restaurant.avgRating.toFixed(1)} ({restaurant.totalRatings} reseñas)</div>
            </div>
          </div>

          {restaurant.categories?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-display text-base font-semibold text-gray-900 mb-3">Categorías</h2>
              <div className="flex flex-wrap gap-2">
                {restaurant.categories.map(c => (
                  <span key={c} className="px-2.5 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Reservas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" /> Reservas recientes
              {reservations && <span className="text-sm font-normal text-gray-500">({reservations.totalElements} total)</span>}
            </h2>

            {!reservations?.content.length ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>Sin reservas aún</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.content.map(res => (
                  <div key={res.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 text-sm">{res.customerName}</p>
                        <code className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">{res.confirmationCode}</code>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatDate(res.reservationDate)} · {formatTime(res.startTime)} · {res.partySize} personas
                        {res.customerPhone && ` · ${res.customerPhone}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[res.status])}>
                        {STATUS_LABELS[res.status]}
                      </span>
                      {res.status === 'PENDING' && (
                        <button onClick={async () => { await confirmMutation.mutateAsync(res.id); toast.success('Reserva confirmada'); }}
                          className="px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg">
                          Confirmar
                        </button>
                      )}
                      {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                        <button onClick={async () => { await cancelMutation.mutateAsync({ id: res.id }); toast.success('Cancelada'); }}
                          className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gestión del dueño: horarios y galería (S2-02 / S2-03) */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScheduleEditor restaurantId={id} />
        <PhotoManager restaurantId={id} />
      </div>

      {/* Mesas y secciones (S7-01) */}
      <div className="mt-6">
        <TablesManager restaurantId={id} />
      </div>
    </div>
  );
}
