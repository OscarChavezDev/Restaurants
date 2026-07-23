'use client';

import Link from 'next/link';
import {
  Calendar, Users, BarChart3, ArrowRight, CheckCircle, Clock, AlertCircle, CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants } from '@/hooks/useRestaurants';
import { useManagedReservations, useConfirmReservation, useCancelReservation } from '@/hooks/useReservations';
import { formatTime, todayLocal } from '@/utils/formatters';
import toast from 'react-hot-toast';

export function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: restaurants } = useMyRestaurants();
  const { reservations } = useManagedReservations();
  const confirmMutation = useConfirmReservation();
  const cancelMutation = useCancelReservation();

  const today = todayLocal();
  const pending = reservations.filter((r) => r.status === 'PENDING');
  const restaurantList = restaurants?.content ?? [];
  const pendingApproval = restaurantList.filter((r) => r.status === 'PENDING_APPROVAL').length;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const todayLabel = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  const actions = [
    { href: '/dashboard/restaurants', icon: CheckCheck,  label: 'Aprobar restaurantes', desc: 'Revisa solicitudes' },
    { href: '/dashboard/reservations', icon: Calendar,   label: 'Reservas',             desc: 'Todas las reservas' },
    { href: '/dashboard/users',        icon: Users,      label: 'Usuarios',             desc: 'Gestiona cuentas' },
    { href: '/dashboard/reports',      icon: BarChart3,  label: 'Reportes',             desc: 'Métricas del sistema' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          {greeting}, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1 capitalize">{todayLabel}</p>
      </div>

      {pendingApproval > 0 && (
        <Link
          href="/dashboard/restaurants"
          className="flex items-center gap-3 mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 hover:bg-yellow-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-gray-700 flex-1">
            Hay <strong>{pendingApproval}</strong> restaurante(s) pendiente(s) de aprobación.
          </p>
          <ArrowRight className="h-4 w-4 text-yellow-600" />
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        {actions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200 transition-all"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mb-3 group-hover:scale-110 transition-transform">
              <a.icon className="h-5 w-5" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" /> Reservas por confirmar
            </h2>
            {pending.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-orange-500 text-white text-xs font-bold">
                {pending.length}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400 opacity-60" />
              <p className="text-sm">¡Todo al día! No hay reservas pendientes de confirmar.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 6).map((res) => (
                <div key={res.id} className="flex items-center justify-between gap-3 p-4 rounded-xl bg-gray-50 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900 text-sm">{res.customerName}</p>
                      {res.reservationDate === today && (
                        <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 text-[10px] font-bold uppercase tracking-wide">Hoy</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {res.restaurantName} · {res.reservationDate} · {formatTime(res.startTime)} · {res.partySize} pers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => { await confirmMutation.mutateAsync(res.id); toast.success('Reserva confirmada'); }}
                      disabled={confirmMutation.isPending}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={async () => { await cancelMutation.mutateAsync({ id: res.id }); toast.success('Reserva cancelada'); }}
                      disabled={cancelMutation.isPending}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
              {pending.length > 6 && (
                <Link href="/dashboard/reservations" className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium pt-2">
                  Ver las {pending.length} reservas pendientes →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
