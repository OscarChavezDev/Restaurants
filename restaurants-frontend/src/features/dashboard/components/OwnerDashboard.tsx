'use client';

import Link from 'next/link';
import {
  Calendar, UtensilsCrossed, ArrowRight, CheckCircle, Clock,
  AlertCircle, TrendingUp, DollarSign, XCircle, Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/uiStore';
import { useMyRestaurants } from '@/hooks/useRestaurants';
import { useManagedReservations, useConfirmReservation, useCancelReservation } from '@/hooks/useReservations';
import { useRestaurantStats } from '@/hooks/useRestaurantStats';
import { TableAssignmentBoard } from '@/features/dashboard/components/TableAssignmentBoard';
import { formatTime, todayLocal } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { cn } from '@/utils/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  PENDING_APPROVAL: { label: 'Revisión', cls: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20' },
  TEMPORARILY_CLOSED: { label: 'Cerrado temporalmente', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20' },
  INACTIVE: { label: 'Inactivo', cls: 'bg-gray-100 text-gray-600 dark:bg-neutral-700/50 dark:text-gray-400 border-gray-200 dark:border-neutral-600' },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring', stiffness: 100 }
  }
};

export function OwnerDashboard() {
  const user = useAuthStore((s) => s.user);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const tickColor = isDark ? '#a3a3a3' : '#6b7280';
  const tooltipStyle = {
    borderRadius: '16px',
    border: 'none',
    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    backgroundColor: isDark ? '#262626' : '#ffffff',
    color: isDark ? '#f5f5f5' : '#111827',
  };
  const tooltipLabelStyle = { fontWeight: 'bold' as const, color: isDark ? '#f5f5f5' : '#111827' };
  const { data: restaurants, isLoading: isRestaurantsLoading } = useMyRestaurants();
  
  const restaurant = restaurants?.content?.[0];
  const restaurantId = restaurant?.id;

  const { reservations } = useManagedReservations();
  const { data: stats, isLoading: isStatsLoading } = useRestaurantStats(restaurantId, { groupBy: 'day' });

  const confirmMutation = useConfirmReservation();
  const cancelMutation = useCancelReservation();

  const today = todayLocal();
  const pending = reservations.filter((r) => r.status === 'PENDING');
  const todayReservations = reservations.filter((r) => r.reservationDate === today && r.status !== 'CANCELLED');
  const unassignedToday = reservations.filter((r) =>
    r.reservationDate === today && !r.tableId && !!r.sectionId && (r.status === 'PENDING' || r.status === 'CONFIRMED')
  );

  // Prioridad dinámica: si no hay reservas por confirmar, no tiene sentido que
  // "¡Estás al día!" ocupe el primer lugar — se muestra el tablero de mesas
  // primero, que es información accionable. Si sí hay reservas pendientes,
  // esas van primero (hay que confirmarlas antes de poder asignarles mesa).
  const mesasFirst = pending.length === 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const todayLabel = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });

  if (isRestaurantsLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Si no tiene restaurante, le mostramos una pantalla vacía bonita
  if (!restaurant) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <UtensilsCrossed className="h-10 w-10 text-orange-500" />
        </div>
        <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">Bienvenido a tu Panel de Control</h2>
        <p className="text-gray-500 mb-8 max-w-md">Para empezar a recibir reservas y ver tus estadísticas, necesitas registrar tu restaurante en la plataforma.</p>
        <Link href="/dashboard/restaurants/new" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
          <Plus className="h-5 w-5" /> Crear mi restaurante
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {/* HEADER FIJO MEJORADO */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-8 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-orange-500 font-bold mb-1 uppercase tracking-widest text-[10px]">{todayLabel}</p>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {greeting}, {user?.fullName?.split(' ')[0]}
            </h1>
          </div>
          <div className="flex items-center gap-3 bg-gray-50/50 dark:bg-neutral-800/30 p-1.5 rounded-3xl border border-gray-100/50 dark:border-neutral-800/50">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700">
              <UtensilsCrossed className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-gray-900 dark:text-white text-sm">{restaurant.name}</span>
              {restaurant.status !== 'ACTIVE' && STATUS_BADGE[restaurant.status] && (
                <span className={cn('ml-2 px-2.5 py-0.5 border text-[10px] font-bold rounded-full uppercase tracking-wider', STATUS_BADGE[restaurant.status].cls)}>
                  {STATUS_BADGE[restaurant.status].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta: reservas de hoy sin mesa asignada */}
      {unassignedToday.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="flex items-start gap-3 bg-orange-50 dark:bg-orange-500/5 border border-orange-200 dark:border-orange-500/20 rounded-2xl p-4"
        >
          <div className="mt-0.5 font-bold text-orange-600 dark:text-orange-400">!</div>
          <div className="flex-1">
            <p className="font-semibold text-orange-800 dark:text-orange-300 text-sm">
              {unassignedToday.length} reserva(s) de hoy sin mesa asignada.
            </p>
            <p className="text-orange-700 dark:text-orange-400 opacity-90 text-xs mt-0.5">
              Asígnales una en el tablero de mesas de abajo.
            </p>
          </div>
        </motion.div>
      )}

      {/* Orden dinámico: por defecto "Reservas por Confirmar" va primero (hay que
          confirmar antes de poder asignar mesa), pero si ya no queda ninguna por
          confirmar y sí hay mesas por asignar, el tablero de mesas pasa a ser lo
          primero — es el trabajo real pendiente en ese momento. */}
      {mesasFirst && (
        <motion.div variants={itemVariants}>
          {restaurantId && <TableAssignmentBoard restaurantId={restaurantId} />}
        </motion.div>
      )}

      <motion.div variants={itemVariants}>
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-orange-500" /> Tareas: Reservas por Confirmar
            </h3>
            <Link href="/dashboard/reservations" className="inline-flex items-center gap-1 text-sm font-bold text-orange-600 dark:text-orange-400 hover:gap-1.5 transition-all shrink-0">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {pending.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 text-green-500 mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">¡Estás al día!</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm">No hay reservas pendientes de confirmación en este momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pending.map(res => {
                // Si la reserva exige adelanto, no basta con "Confirmar" — primero hay que
                // verificar el comprobante de pago (eso confirma solo, ver /dashboard/pagos).
                const needsPayment = res.paymentStatus === 'PENDING_PAYMENT' || res.paymentStatus === 'PROOF_SUBMITTED';
                return (
                <div key={res.id} className="group bg-gray-50 dark:bg-neutral-900 rounded-2xl p-4 border border-gray-100 dark:border-neutral-800 hover:border-orange-200 dark:hover:border-orange-500/50 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg">
                        {res.customerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{res.customerName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(res.reservationDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-full",
                      needsPayment
                        ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400"
                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-500"
                    )}>
                      {needsPayment ? 'Falta pago' : 'Pendiente'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4 gap-2">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">{res.partySize}</span> <span className="text-gray-500 dark:text-gray-400 text-xs">personas</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await cancelMutation.mutateAsync({ id: res.id });
                            toast.error('Rechazada');
                          } catch {
                            toast.error('No se pudo rechazar la reserva');
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl transition-colors"
                        title="Rechazar"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                      {needsPayment ? (
                        <Link
                          href="/dashboard/pagos"
                          className="px-4 py-2 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm font-semibold rounded-xl hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-colors"
                        >
                          Ver pago
                        </Link>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await confirmMutation.mutateAsync(res.id);
                              toast.success('Confirmada');
                            } catch {
                              toast.error('No se pudo confirmar la reserva');
                            }
                          }}
                          disabled={confirmMutation.isPending}
                          className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
                        >
                          Confirmar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>

      {!mesasFirst && (
        <motion.div variants={itemVariants}>
          {restaurantId && <TableAssignmentBoard restaurantId={restaurantId} />}
        </motion.div>
      )}

      {/* 2. Key Metrics Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/dashboard/reservations" className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform"><Calendar className="h-16 w-16" /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><Calendar className="h-5 w-5" /></div>
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">Reservas Hoy</p>
          </div>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">{todayReservations.length}</p>
        </Link>

        <Link href="/dashboard/reports" className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-red-200 dark:hover:border-red-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform"><AlertCircle className="h-16 w-16" /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">Tasa No-Show</p>
          </div>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            {stats?.tasaNoShow !== undefined ? `${stats.tasaNoShow.toFixed(1)}%` : '--'}
          </p>
        </Link>

        <Link href="/dashboard/pagos" className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-green-200 dark:hover:border-green-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform"><DollarSign className="h-16 w-16" /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"><DollarSign className="h-5 w-5" /></div>
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">Adelantos (Mes)</p>
          </div>
          <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">
            {stats?.ingresoAdelantos !== undefined ? `S/ ${stats.ingresoAdelantos.toFixed(2)}` : '--'}
          </p>
        </Link>

        <Link href="/dashboard/reports" className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-gray-100 dark:border-neutral-700 shadow-sm hover:shadow-md hover:border-orange-200 dark:hover:border-orange-500/30 transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5 group-hover:scale-110 transition-transform"><TrendingUp className="h-16 w-16" /></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
            <p className="font-medium text-gray-500 dark:text-gray-400 text-sm">Plato Estrella</p>
          </div>
          {stats?.platosMasPedidos?.length ? (
            <>
              <p className="text-xl font-display font-bold text-gray-900 dark:text-white leading-tight truncate">
                {stats.platosMasPedidos[0].dishName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stats.platosMasPedidos[0].cantidad} pedidos</p>
            </>
          ) : (
            <p className="text-3xl font-display font-bold text-gray-900 dark:text-white">--</p>
          )}
        </Link>
      </motion.div>

      {/* 3. Charts Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico 1: Evolución de Reservas */}
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-orange-500" /> Evolución de Reservas
          </h3>
          <div className="h-72 w-full">
            {isStatsLoading ? (
              <div className="w-full h-full bg-gray-50 dark:bg-neutral-700 animate-pulse rounded-xl" />
            ) : !stats?.reservasPorPeriodo?.length ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500">
                <Calendar className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm">Sin datos suficientes</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.reservasPorPeriodo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReservas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-700" />
                  <XAxis dataKey="periodo" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Area type="monotone" dataKey="cantidad" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorReservas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Gráfico 2: Platos Top */}
        <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <UtensilsCrossed className="h-5 w-5 text-orange-500" /> Top Platos Solicitados
          </h3>
          <div className="h-72 w-full">
            {isStatsLoading ? (
              <div className="w-full h-full bg-gray-50 dark:bg-neutral-700 animate-pulse rounded-xl" />
            ) : !stats?.platosMasPedidos?.length ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-neutral-500">
                <UtensilsCrossed className="h-8 w-8 mb-2 opacity-50" />
                <span className="text-sm">Sin datos suficientes</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.platosMasPedidos.slice(0, 5)} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:stroke-neutral-700" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} />
                  <YAxis dataKey="dishName" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: tickColor }} width={120} />
                  <Tooltip
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                  />
                  <Bar dataKey="cantidad" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
