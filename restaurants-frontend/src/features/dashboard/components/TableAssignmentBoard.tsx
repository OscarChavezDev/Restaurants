'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LayoutGrid } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { useRestaurantReservations } from '@/hooks/useReservations';
import { TableMatrixCard } from '@/components/ui/TableMatrixCard';
import { TableReservationModal } from '@/components/ui/TableReservationModal';
import { cn } from '@/utils/cn';
import type { RestaurantTable } from '@/types/restaurant';
import type { Reservation } from '@/types/reservation';
import { isBefore, isAfter, parse, addMinutes, isSameDay } from 'date-fns';

function getTableStatus(table: RestaurantTable, allReservations: Reservation[]) {
  if (table.currentStatus === 'OCCUPIED' || table.currentStatus === 'UNAVAILABLE') {
    return table.currentStatus as 'OCCUPIED' | 'UNAVAILABLE';
  }

  const tableRes = allReservations.filter(r => r.tableId === table.id);
  const today = new Date();
  const active = tableRes.filter(r => {
    if (r.status !== 'PENDING' && r.status !== 'CONFIRMED') return false;
    return isSameDay(parse(r.reservationDate, 'yyyy-MM-dd', new Date()), today);
  });

  let status: 'AVAILABLE' | 'OCCUPIED' | 'UPCOMING' = 'AVAILABLE';
  for (const res of active) {
    const startTime = parse(`${res.reservationDate} ${res.startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    const endTime = res.endTime
      ? parse(`${res.reservationDate} ${res.endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())
      : addMinutes(startTime, 120);
    const bufferStart = addMinutes(startTime, -15);

    if (isAfter(today, bufferStart) && isBefore(today, endTime)) {
      return 'OCCUPIED';
    } else if (isBefore(today, bufferStart)) {
      status = 'UPCOMING';
    }
  }
  return status;
}

/**
 * Tablero en vivo de mesas: ver estado y asignar/quitar mesas a reservas.
 * La creación/eliminación de ambientes y mesas vive en TablesManager
 * (pestaña Restaurante) — este componente es solo para operar el día a día.
 */
export function TableAssignmentBoard({ restaurantId }: { restaurantId: string }) {
  const { data: sections } = useQuery({
    queryKey: ['sections', restaurantId],
    queryFn: () => restaurantService.getSections(restaurantId),
    enabled: !!restaurantId,
  });
  const { data: tables } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: () => restaurantService.getTables(restaurantId),
    enabled: !!restaurantId,
    // El estado de la mesa puede cambiar desde fuera (ej. el software del
    // mesero marcándola ocupada/libre), no solo desde acciones en este
    // dashboard — por eso este tablero refresca solo, a diferencia del resto
    // de queries que usan el staleTime por defecto.
    refetchInterval: 10000,
  });

  const { data: reservationsData } = useRestaurantReservations(restaurantId, 0, 200);
  const reservations = reservationsData?.content || [];

  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const selectedTable = tables?.find(t => t.id === selectedTableId) || null;

  const tablesBySection: Record<string, RestaurantTable[]> = {};
  const unassignedTables: RestaurantTable[] = [];
  (tables || []).forEach(t => {
    if (t.sectionId) {
      if (!tablesBySection[t.sectionId]) tablesBySection[t.sectionId] = [];
      tablesBySection[t.sectionId].push(t);
    } else {
      unassignedTables.push(t);
    }
  });

  const availableSections = sections || [];
  const currentTab = activeTabId
    ? activeTabId
    : (availableSections.length > 0 ? availableSections[0].id : (unassignedTables.length > 0 ? 'unassigned' : null));

  const currentSectionTables = currentTab === 'unassigned' ? unassignedTables : (currentTab ? tablesBySection[currentTab] || [] : []);

  const stats = { AVAILABLE: 0, OCCUPIED: 0, UPCOMING: 0, UNAVAILABLE: 0 };
  currentSectionTables.forEach(t => {
    stats[getTableStatus(t, reservations)]++;
  });

  if (!tables || tables.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm text-center py-10">
        <LayoutGrid className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Todavía no tienes mesas configuradas. Créalas desde{' '}
          <a href={`/dashboard/restaurants/${restaurantId}`} className="text-orange-500 hover:underline">
            Restaurante
          </a>.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-gray-100 dark:border-neutral-700 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h3 className="font-display font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
          <LayoutGrid className="h-5 w-5 text-orange-500" /> Mesas (En Vivo)
        </h3>
        <div className="flex items-center gap-4 text-[11px] font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <div className="w-2 h-2 rounded-full bg-emerald-500" /> {stats.AVAILABLE} Libres
          </span>
          <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
            <div className="w-2 h-2 rounded-full bg-red-500" /> {stats.OCCUPIED} Ocupadas
          </span>
          <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <div className="w-2 h-2 rounded-full bg-amber-500" /> {stats.UPCOMING} Reservadas
          </span>
          <span className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
            <div className="w-2 h-2 rounded-full bg-gray-400" /> {stats.UNAVAILABLE} N/D
          </span>
        </div>
      </div>

      {/* Tabs de ambientes */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0 scrollbar-hide mb-4">
        {availableSections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveTabId(section.id)}
            className={cn(
              "whitespace-nowrap px-3.5 py-2 text-sm font-semibold rounded-xl transition-all",
              currentTab === section.id
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/20"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:!bg-white/5"
            )}
          >
            {section.name}
            <span className={cn("ml-1.5 text-xs", currentTab === section.id ? "text-white/70" : "text-gray-400 dark:text-gray-500")}>
              {(tablesBySection[section.id] || []).length}
            </span>
          </button>
        ))}
        {unassignedTables.length > 0 && (
          <button
            onClick={() => setActiveTabId('unassigned')}
            className={cn(
              "whitespace-nowrap px-3.5 py-2 text-sm font-semibold rounded-xl transition-all",
              currentTab === 'unassigned'
                ? "bg-gray-600 dark:bg-gray-700 text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:!bg-white/5"
            )}
          >
            Sin asignar
            <span className={cn("ml-1.5 text-xs", currentTab === 'unassigned' ? "text-white/70" : "text-gray-400")}>{unassignedTables.length}</span>
          </button>
        )}
      </div>

      {/* Alerta de reservas sin mesa en este ambiente */}
      {currentTab && (() => {
        const unassigned = reservations.filter(r => !r.tableId && r.sectionId === currentTab && (r.status === 'PENDING' || r.status === 'CONFIRMED'));
        if (unassigned.length === 0) return null;
        return (
          <div className="bg-orange-50 dark:!bg-orange-500/5 border border-orange-200 dark:!border-orange-500/20 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-orange-800 dark:text-orange-300">
            <div className="mt-0.5 font-bold text-orange-600">!</div>
            <div>
              <p className="font-semibold">{unassigned.length} reserva(s) sin mesa asignada.</p>
              <p className="text-orange-700 dark:text-orange-400 opacity-90 text-xs mt-0.5">Haz clic en una mesa de este ambiente para asignarles una.</p>
            </div>
          </div>
        );
      })()}

      {/* Grid de mesas */}
      {currentTab && currentSectionTables.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
          {currentSectionTables.map(t => (
            <TableMatrixCard
              key={t.id}
              table={t}
              reservations={reservations.filter(r => r.tableId === t.id)}
              onClick={() => setSelectedTableId(t.id)}
            />
          ))}
        </div>
      )}

      <TableReservationModal
        isOpen={!!selectedTableId}
        onClose={() => setSelectedTableId(null)}
        table={selectedTable}
        reservations={reservations}
        restaurantId={restaurantId}
      />
    </div>
  );
}
