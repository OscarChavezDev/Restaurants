'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Mail, Users, Star, Calendar, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Pencil, ExternalLink, Loader2 } from 'lucide-react';
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
import { BasicInfoCard } from '@/components/ui/BasicInfoCard';
import { FeaturesCard } from '@/components/ui/FeaturesCard';
import { CategoriesCard } from '@/components/ui/CategoriesCard';
import toast from 'react-hot-toast';
import type { RestaurantStatus } from '@/types/restaurant';

export default function RestaurantDetailDashboard() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isAdmin = useAuthStore(s => s.isAdmin());
  const qc = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const statusIcon = restaurant.status === 'PENDING_APPROVAL' ? AlertCircle : restaurant.status === 'ACTIVE' ? CheckCircle : XCircle;
  const StatusIcon = statusIcon;

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
      {/* ─── HEADER FIJO MEJORADO ─── */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-8 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/restaurants" className="p-2.5 rounded-2xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors shrink-0 mt-1 shadow-sm">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">{restaurant.name}</h1>
                <span className={cn('px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border shadow-sm', 
                  restaurant.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                  restaurant.status === 'PENDING_APPROVAL' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                  'bg-gray-50 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:border-neutral-700'
                )}>
                  {STATUS_LABELS[restaurant.status]}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-mono text-sm">/{restaurant.slug}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-neutral-800/30 p-1.5 rounded-3xl border border-gray-100/50 dark:border-neutral-800/50">
            <Link href={`/restaurants/${restaurant.slug}`}
              className="px-6 py-3 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all shadow-sm flex items-center gap-2">
              <ExternalLink className="h-4 w-4" /> Ver página pública
            </Link>
            {confirmDelete ? (
              <div className="flex items-center gap-2 pl-4 pr-1.5 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
                <span className="text-xs font-semibold text-red-700 dark:text-red-400">¿Eliminar restaurante?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                >
                  {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Sí, eliminar'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-3 rounded-2xl text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 bg-white dark:bg-neutral-800 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-gray-200 dark:border-neutral-700 shadow-sm" title="Eliminar restaurante">
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── PANEL DE APROBACIÓN (solo ADMIN) ─── */}
      {isAdmin && (
        <div className={cn('rounded-3xl border p-6 shadow-sm', {
          'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-900/30': restaurant.status === 'PENDING_APPROVAL',
          'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30': restaurant.status === 'ACTIVE',
          'bg-gray-50 border-gray-200 dark:bg-neutral-900 dark:border-neutral-800': restaurant.status === 'INACTIVE' || restaurant.status === 'TEMPORARILY_CLOSED',
        })}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", {
                'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-500': restaurant.status === 'PENDING_APPROVAL',
                'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-500': restaurant.status === 'ACTIVE',
                'bg-gray-200 dark:bg-neutral-800 text-gray-500 dark:text-gray-400': restaurant.status === 'INACTIVE' || restaurant.status === 'TEMPORARILY_CLOSED',
              })}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  {restaurant.status === 'PENDING_APPROVAL' && 'Aprobación Pendiente'}
                  {restaurant.status === 'ACTIVE' && 'Restaurante Activo'}
                  {restaurant.status === 'INACTIVE' && 'Restaurante Desactivado'}
                  {restaurant.status === 'TEMPORARILY_CLOSED' && 'Cerrado Temporalmente'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {restaurant.status === 'PENDING_APPROVAL' && 'Revisa los datos y aprueba este restaurante para que sea visible en el catálogo público.'}
                  {restaurant.status === 'ACTIVE' && 'Este restaurante es visible públicamente y puede recibir reservas.'}
                  {restaurant.status === 'INACTIVE' && 'No aparece en el listado ni buscador público (su página sigue siendo accesible por enlace directo).'}
                  {restaurant.status === 'TEMPORARILY_CLOSED' && 'El dueño lo marcó como cerrado temporalmente. No aparece en el listado ni buscador público.'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {restaurant.status === 'PENDING_APPROVAL' && (
                <>
                  <button onClick={() => changeStatus.mutate('INACTIVE')} disabled={changeStatus.isPending} className="px-5 py-2.5 bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all shadow-sm flex items-center gap-2">
                    <XCircle className="h-4 w-4" /> Rechazar
                  </button>
                  <button onClick={() => changeStatus.mutate('ACTIVE')} disabled={changeStatus.isPending} className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all shadow-sm shadow-green-500/20 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Aprobar Restaurante
                  </button>
                </>
              )}
              {restaurant.status === 'ACTIVE' && (
                <button onClick={() => changeStatus.mutate('INACTIVE')} disabled={changeStatus.isPending} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all shadow-sm shadow-red-500/20 flex items-center gap-2">
                  <XCircle className="h-4 w-4" /> Desactivar
                </button>
              )}
              {(restaurant.status === 'INACTIVE' || restaurant.status === 'TEMPORARILY_CLOSED') && (
                <button onClick={() => changeStatus.mutate('ACTIVE')} disabled={changeStatus.isPending} className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-all shadow-sm shadow-green-500/20 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Activar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── SECCIÓN 1: Datos + Características + Categorías ─── */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-4 ml-1">Información General</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <BasicInfoCard restaurant={restaurant} />
          <FeaturesCard restaurant={restaurant} />
          <CategoriesCard restaurant={restaurant} />
        </div>
      </div>

      {/* ─── SECCIÓN 2: Horario + Galería ─── */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-4 ml-1">Gestión del Restaurante</h2>
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* Horario: toma 3/5 del espacio */}
          <div className="xl:col-span-3">
            <ScheduleEditor restaurantId={id} />
          </div>
          {/* Galería: toma 2/5 del espacio */}
          <div className="xl:col-span-2">
            <PhotoManager restaurantId={id} />
          </div>
        </div>
      </div>

      {/* ─── SECCIÓN 3: Mesas ─── */}
      <div>
        <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] mb-4 ml-1">Distribución de Mesas</h2>
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm p-6">
          <TablesManager restaurantId={id} />
        </div>
      </div>

      {/* ─── SECCIÓN 4: Reservas Recientes (tabla compacta) ─── */}
      <div>
        <div className="flex items-center justify-between mb-4 ml-1">
          <h2 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Reservas Recientes</h2>
          {reservations && (
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
              {reservations.totalElements} total
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden">
          {!reservations?.content.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500">
              <div className="w-16 h-16 bg-gray-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-3">
                <Calendar className="h-8 w-8 opacity-40" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white text-sm mb-0.5">Sin reservas aún</p>
              <p className="text-xs">Las reservas que recibas aparecerán aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-neutral-800">
                    <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cliente</th>
                    <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden sm:table-cell">Código</th>
                    <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="text-left py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:table-cell">Hora</th>
                    <th className="text-center py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider hidden md:table-cell">Personas</th>
                    <th className="text-center py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="text-right py-3.5 px-5 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-neutral-800/50">
                  {reservations.content.map(res => (
                    <tr key={res.id} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors group">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs shrink-0">
                            {res.customerName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{res.customerName}</p>
                            {res.customerPhone && <p className="text-xs text-gray-400 dark:text-gray-500">{res.customerPhone}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-5 hidden sm:table-cell">
                        <code className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">
                          #{res.confirmationCode}
                        </code>
                      </td>
                      <td className="py-3 px-5">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{formatDate(res.reservationDate)}</span>
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{formatTime(res.startTime)}</span>
                      </td>
                      <td className="py-3 px-5 text-center hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                          <Users className="h-3.5 w-3.5 text-gray-400" /> {res.partySize}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-center">
                        <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-bold border', 
                          res.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/50' :
                          res.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900/50' :
                          res.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50' :
                          'bg-gray-50 text-gray-700 border-gray-200 dark:bg-neutral-800 dark:text-gray-400 dark:border-neutral-700'
                        )}>
                          {STATUS_LABELS[res.status]}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex justify-end gap-1.5">
                          {res.status === 'PENDING' && (
                            <button onClick={async () => { await confirmMutation.mutateAsync(res.id); toast.success('Reserva confirmada'); }}
                              className="p-1.5 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 rounded-lg transition-colors" title="Confirmar">
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                            <button onClick={async () => { await cancelMutation.mutateAsync({ id: res.id }); toast.success('Cancelada'); }}
                              className="p-1.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-lg transition-colors" title="Cancelar">
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
