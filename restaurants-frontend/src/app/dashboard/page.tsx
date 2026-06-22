'use client';

import Link from 'next/link';
import {
  Plus, Calendar, Tag, UtensilsCrossed, Users, BarChart3,
  ArrowRight, CheckCircle, Clock, AlertCircle, ExternalLink, CheckCheck,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants } from '@/hooks/useRestaurants';
import { useManagedReservations, useConfirmReservation, useCancelReservation } from '@/hooks/useReservations';
import { formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: restaurants } = useMyRestaurants();
  const { reservations } = useManagedReservations();
  const confirmMutation = useConfirmReservation();
  const cancelMutation = useCancelReservation();

  const today = new Date().toISOString().slice(0, 10);
  const pending = reservations.filter((r) => r.status === 'PENDING');
  const restaurantList = restaurants?.content ?? [];
  const pendingApproval = restaurantList.filter((r) => r.status === 'PENDING_APPROVAL').length;

  // Saludo según la hora
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const todayLabel = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  const actions = isAdmin
    ? [
        { href: '/dashboard/restaurants', icon: CheckCheck,  label: 'Aprobar restaurantes', desc: 'Revisa solicitudes' },
        { href: '/dashboard/reservations', icon: Calendar,   label: 'Reservas',             desc: 'Todas las reservas' },
        { href: '/dashboard/users',        icon: Users,      label: 'Usuarios',             desc: 'Gestiona cuentas' },
        { href: '/dashboard/reports',      icon: BarChart3,  label: 'Reportes',             desc: 'Métricas del sistema' },
      ]
    : [
        { href: '/dashboard/restaurants',  icon: UtensilsCrossed, label: 'Restaurantes', desc: 'Gestiona tus locales' },
        { href: '/dashboard/reservations', icon: Calendar,        label: 'Reservas',     desc: 'Gestiona reservas' },
        { href: '/dashboard/promotions',   icon: Tag,             label: 'Promociones',  desc: 'Crea ofertas' },
        { href: '/dashboard/menus',        icon: UtensilsCrossed, label: 'Menús',        desc: 'Edita tu carta' },
      ];

  return (
    <div>
      {/* Saludo */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          {greeting}, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1 capitalize">{todayLabel}</p>
      </div>

      {/* Aviso: restaurantes pendientes de aprobación */}
      {pendingApproval > 0 && (
        <Link
          href="/dashboard/restaurants"
          className="flex items-center gap-3 mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 px-5 py-4 hover:bg-yellow-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-gray-700 flex-1">
            {isAdmin
              ? <>Hay <strong>{pendingApproval}</strong> restaurante(s) pendiente(s) de aprobación.</>
              : <>Tienes <strong>{pendingApproval}</strong> restaurante(s) esperando aprobación del administrador.</>}
          </p>
          <ArrowRight className="h-4 w-4 text-yellow-600" />
        </Link>
      )}

      {/* Acciones rápidas */}
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
        {/* Pendientes de confirmar */}
        <div className={cn('rounded-2xl bg-white border border-gray-100 shadow-sm p-6', isAdmin ? 'lg:col-span-3' : 'lg:col-span-2')}>
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

        {/* Mis restaurantes (solo dueño) */}
        {!isAdmin && (
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-gray-900">
              Mis restaurantes
            </h2>
            <Link href="/dashboard/restaurants/new" className="text-orange-600 hover:text-orange-700" title="Nuevo restaurante">
              <Plus className="h-5 w-5" />
            </Link>
          </div>

          {restaurantList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm mb-4">Aún no tienes restaurantes</p>
              <Link href="/dashboard/restaurants/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors">
                <Plus className="h-4 w-4" /> Crear
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {restaurantList.slice(0, 5).map((r) => (
                <Link
                  key={r.id}
                  href={`/dashboard/restaurants/${r.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-500 font-display font-bold flex-shrink-0">
                    {r.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate group-hover:text-orange-600 transition-colors">{r.name}</p>
                    <span className={cn('inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium', STATUS_COLORS[r.status])}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-orange-500 transition-colors" />
                </Link>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
