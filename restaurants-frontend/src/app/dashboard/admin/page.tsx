'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { subDays, subMonths, subYears, format } from 'date-fns';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Building2, Users, Wallet, Star, Trophy } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSystemStats } from '@/hooks/useAdmin';

const RANGE_PRESETS = {
  week: { label: 'Última semana', from: () => subDays(new Date(), 7) },
  month: { label: 'Último mes', from: () => subMonths(new Date(), 1) },
  year: { label: 'Último año', from: () => subYears(new Date(), 1) },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308'];

const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

const STATUS_LABELS_ES: Record<string, string> = {
  ACTIVE: 'Activo', INACTIVE: 'Inactivo', TEMPORARILY_CLOSED: 'Cerrado temporalmente', PENDING_APPROVAL: 'Pendiente',
  ADMIN: 'Administradores', RESTAURANTE_OWNER: 'Dueños', CLIENTE: 'Clientes', SYSTEM_INTEGRATION: 'Integraciones',
  PENDING: 'Pendiente', CONFIRMED: 'Confirmada', ARRIVED: 'Llegó', CANCELLED: 'Cancelada', COMPLETED: 'Completada', NO_SHOW: 'No-show',
};

export default function AdminPanelPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const [range, setRange] = useState<RangeKey>('month');

  useEffect(() => {
    if (!isAdmin) router.replace('/dashboard');
  }, [isAdmin, router]);

  const params = useMemo(() => ({
    from: format(RANGE_PRESETS[range].from(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  }), [range]);

  const { data: stats, isLoading } = useSystemStats(params);

  if (!isAdmin) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Panel de Administrador</h1>
          <p className="text-gray-600 mt-1">Métricas agregadas de todo el sistema</p>
        </div>
        <div className="flex rounded-xl border border-gray-200 bg-white p-1">
          {Object.entries(RANGE_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setRange(key as RangeKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                range === key ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !stats ? (
        <div className="text-center py-16 text-gray-400 text-sm">Cargando métricas del sistema...</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <KpiCard icon={Building2} color="orange" label="Restaurantes" value={total(stats.restaurantsByStatus)} />
            <KpiCard icon={Users} color="blue" label="Usuarios" value={total(stats.usersByRole)} />
            <KpiCard icon={Wallet} color="green" label="Ingreso por adelantos" value={currency.format(stats.ingresoAdelantosTotal)} />
            <KpiCard icon={Star} color="yellow" label="Rating promedio global" value={`${stats.avgRatingGlobal} / 5`} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <ChartCard title="Restaurantes por estado">
              <PieBlock data={stats.restaurantsByStatus} />
            </ChartCard>
            <ChartCard title="Usuarios por rol">
              <PieBlock data={stats.usersByRole} />
            </ChartCard>
            <ChartCard title="Reservas por estado (sistema)">
              {stats.reservationsByStatus.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={stats.reservationsByStatus.map((d) => ({ ...d, label: STATUS_LABELS_ES[d.key] ?? d.key }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="cantidad" name="Reservas" fill="#f97316" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-display text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-orange-500" /> Restaurantes con más reservas en el período
            </h2>
            {stats.topRestaurants.length === 0 ? (
              <p className="text-sm text-gray-400 py-6 text-center">Sin reservas en este período.</p>
            ) : (
              <div className="space-y-2">
                {stats.topRestaurants.map((r, i) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-xs font-bold">{i + 1}</span>
                      <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{r.totalReservas} reservas</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function total(items: { cantidad: number }[]) {
  return items.reduce((sum, i) => sum + i.cantidad, 0);
}

function KpiCard({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string | number }) {
  const colors: Record<string, string> = {
    orange: 'bg-orange-100 text-orange-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${colors[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-display text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-display text-base font-semibold text-gray-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function PieBlock({ data }: { data: { key: string; cantidad: number }[] }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data.map((d) => ({ ...d, label: STATUS_LABELS_ES[d.key] ?? d.key }))}
          dataKey="cantidad"
          nameKey="label"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ label, cantidad }) => `${label} (${cantidad})`}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center text-sm text-gray-400">
      Sin datos en este período
    </div>
  );
}
