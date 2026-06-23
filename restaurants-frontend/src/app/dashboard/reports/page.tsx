'use client';

import { useEffect, useMemo, useState } from 'react';
import { subDays, subMonths, subYears, format } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, AlertTriangle, Wallet, UtensilsCrossed, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useRestaurantStats } from '@/hooks/useRestaurantStats';
import { useAuthStore } from '@/store/authStore';
import { reportExportService } from '@/services/reportExportService';
import toast from 'react-hot-toast';
import type { StatsGroupBy } from '@/types/stats';

const RANGE_PRESETS = {
  week: { label: 'Última semana', from: () => subDays(new Date(), 7) },
  month: { label: 'Último mes', from: () => subMonths(new Date(), 1) },
  year: { label: 'Último año', from: () => subYears(new Date(), 1) },
} as const;

type RangeKey = keyof typeof RANGE_PRESETS;

const PIE_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308'];

const currency = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export default function ReportsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurants = isAdmin ? allRestaurants : myRestaurants;
  const restaurantList = restaurants?.content ?? [];

  const [restaurantId, setRestaurantId] = useState('');
  const [range, setRange] = useState<RangeKey>('month');
  const [groupBy, setGroupBy] = useState<StatsGroupBy>('day');
  const [exporting, setExporting] = useState<'xlsx' | 'pdf' | null>(null);

  useEffect(() => {
    if (!restaurantId && restaurantList.length > 0) {
      setRestaurantId(restaurantList[0].id);
    }
  }, [restaurantList, restaurantId]);

  const params = useMemo(() => ({
    from: format(RANGE_PRESETS[range].from(), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
    groupBy,
  }), [range, groupBy]);

  const { data: stats, isLoading } = useRestaurantStats(restaurantId, params);

  const handleExport = async (fmt: 'xlsx' | 'pdf') => {
    setExporting(fmt);
    try {
      await reportExportService.download(restaurantId, fmt, { from: params.from, to: params.to });
      toast.success('Reporte descargado');
    } catch {
      toast.error('No se pudo generar el reporte');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-600 mt-1">
          {isAdmin ? 'Métricas del sistema por restaurante' : 'El rendimiento de tu restaurante en datos reales'}
        </p>
      </div>

      {restaurantList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400">
          <UtensilsCrossed className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Todavía no hay restaurantes para mostrar estadísticas.</p>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {restaurantList.length > 1 && (
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700"
              >
                {restaurantList.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            )}

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

            <div className="flex rounded-xl border border-gray-200 bg-white p-1">
              {(['day', 'week', 'month'] as StatsGroupBy[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    groupBy === g ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {g === 'day' ? 'Día' : g === 'week' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => handleExport('xlsx')}
                disabled={!restaurantId || exporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                {exporting === 'xlsx' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
                Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={!restaurantId || exporting !== null}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-red-600" />}
                PDF
              </button>
            </div>
          </div>

          {isLoading || !stats ? (
            <div className="text-center py-16 text-gray-400 text-sm">Cargando estadísticas...</div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-red-600 flex-shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tasa de no-show</p>
                    <p className="font-display text-2xl font-bold text-gray-900">{stats.tasaNoShow}%</p>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-green-600 flex-shrink-0">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Ingreso por adelantos</p>
                    <p className="font-display text-2xl font-bold text-gray-900">{currency.format(stats.ingresoAdelantos)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Reservas por período */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-display text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-orange-500" /> Reservas por período
                  </h2>
                  {stats.reservasPorPeriodo.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={stats.reservasPorPeriodo}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="cantidad" name="Reservas" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Rating promedio en el tiempo */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Rating promedio en el tiempo</h2>
                  {stats.ratingPromedioEnElTiempo.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={stats.ratingPromedioEnElTiempo}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="avgScore" name="Rating" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Ocupación por sección */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Ocupación por sección</h2>
                  {stats.ocupacionPorSeccion.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={stats.ocupacionPorSeccion}
                          dataKey="cantidad"
                          nameKey="sectionName"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ sectionName, cantidad }) => `${sectionName} (${cantidad})`}
                        >
                          {stats.ocupacionPorSeccion.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Platos más pedidos */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Platos más pedidos</h2>
                  {stats.platosMasPedidos.length === 0 ? (
                    <EmptyChart />
                  ) : (
                    <ul className="space-y-2">
                      {stats.platosMasPedidos.map((d, i) => (
                        <li key={d.dishName} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                          <span className="text-gray-700"><span className="text-gray-400 mr-2">{i + 1}.</span>{d.dishName}</span>
                          <span className="font-semibold text-gray-900">{d.cantidad}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
      Sin datos en este período
    </div>
  );
}
