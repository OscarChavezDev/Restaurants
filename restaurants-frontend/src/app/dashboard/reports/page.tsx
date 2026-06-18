'use client';

import { BarChart3, TrendingUp, Users, Calendar, UtensilsCrossed, Star } from 'lucide-react';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useManagedReservations } from '@/hooks/useReservations';
import { useAuthStore } from '@/store/authStore';

export default function ReportsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const { reservations } = useManagedReservations();

  const restaurants = isAdmin ? allRestaurants : myRestaurants;

  const totalReservations = reservations.length;
  const totalConfirmed = reservations.filter(r => r.status === 'CONFIRMED').length;
  const totalCancelled = reservations.filter(r => r.status === 'CANCELLED').length;
  const totalCompleted = reservations.filter(r => r.status === 'COMPLETED').length;
  const totalPending   = reservations.filter(r => r.status === 'PENDING').length;
  const eventRelated   = reservations.filter(r => r.isEventRelated).length;

  const stats = [
    { label: 'Restaurantes',         value: restaurants?.totalElements ?? 0, icon: UtensilsCrossed, color: 'bg-orange-100 text-orange-600' },
    { label: 'Reservas totales',     value: totalReservations,               icon: Calendar,       color: 'bg-blue-100 text-blue-600'   },
    { label: 'Confirmadas',          value: totalConfirmed,                    icon: TrendingUp,     color: 'bg-green-100 text-green-600' },
    { label: 'Canceladas',           value: totalCancelled,                    icon: Users,          color: 'bg-red-100 text-red-600'     },
    { label: 'Completadas',          value: totalCompleted,                    icon: Star,           color: 'bg-purple-100 text-purple-600'},
    { label: 'Pendientes',           value: totalPending,                      icon: BarChart3,      color: 'bg-yellow-100 text-yellow-600'},
  ];

  const conversionRate  = totalReservations
    ? Math.round((totalCompleted / totalReservations) * 100) : 0;
  const cancellationRate = totalReservations
    ? Math.round((totalCancelled / totalReservations) * 100) : 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'Métricas y estadísticas del sistema' : 'Estadísticas de tus restaurantes'}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
            <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color} mb-2`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="font-display text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1 leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tasas */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Tasa de conversión</p>
          <p className="font-display text-3xl font-bold text-green-600">{conversionRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Reservas completadas / total</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Tasa de cancelación</p>
          <p className="font-display text-3xl font-bold text-red-500">{cancellationRate}%</p>
          <p className="text-xs text-gray-400 mt-1">Reservas canceladas / total</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Reservas por eventos</p>
          <p className="font-display text-3xl font-bold text-blue-600">{eventRelated}</p>
          <p className="text-xs text-gray-400 mt-1">Vinculadas a eventos externos</p>
        </div>
      </div>

      {/* Tabla de restaurantes */}
      {restaurants && restaurants.content.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">
            {isAdmin ? 'Todos los restaurantes' : 'Mis restaurantes'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Nombre</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Ciudad</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Calificación</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Capacidad</th>
                  <th className="text-right py-2 text-gray-500 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.content.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 text-gray-500">{r.city}</td>
                    <td className="py-3 text-right text-gray-700">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        {r.avgRating.toFixed(1)} ({r.totalRatings})
                      </span>
                    </td>
                    <td className="py-3 text-right text-gray-600">{r.totalCapacity} personas</td>
                    <td className="py-3 text-right">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.status === 'ACTIVE'           ? 'bg-green-100 text-green-700' :
                        r.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-700' :
                                                          'bg-gray-100 text-gray-600'
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
