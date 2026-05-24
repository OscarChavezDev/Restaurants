'use client';

import { UtensilsCrossed, Calendar, Star, TrendingUp } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants } from '@/hooks/useRestaurants';
import { useMyReservations } from '@/hooks/useReservations';

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: restaurants } = useMyRestaurants();
  const { data: reservations } = useMyReservations();

  const stats = [
    {
      label: 'Mis Restaurantes',
      value: restaurants?.totalElements ?? 0,
      icon: UtensilsCrossed,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      label: 'Reservas Activas',
      value: reservations?.content.filter((r) => r.status === 'CONFIRMED' || r.status === 'PENDING').length ?? 0,
      icon: Calendar,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      label: 'Total Reservas',
      value: reservations?.totalElements ?? 0,
      icon: TrendingUp,
      color: 'text-green-600 bg-green-100',
    },
    {
      label: 'Calificación Prom.',
      value: '4.5',
      icon: Star,
      color: 'text-yellow-600 bg-yellow-100',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.fullName?.split(' ')[0]}
        </h1>
        <p className="text-gray-600 mt-1">Panel de control del Sistema de Restaurantes</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white border border-gray-100 p-6 shadow-sm"
          >
            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} mb-4`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Reservations */}
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6">
        <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
          Reservas Recientes
        </h2>
        {reservations?.content.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-40" />
            <p>No hay reservas aún</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations?.content.slice(0, 5).map((res) => (
              <div
                key={res.id}
                className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">{res.customerName}</p>
                  <p className="text-xs text-gray-500">
                    {res.reservationDate} — {res.partySize} personas — Código: {res.confirmationCode}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  res.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                  res.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {res.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
