'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus, Trash2, Loader2, Armchair, Users } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { useRestaurantReservations } from '@/hooks/useReservations';
import { SelectMenu } from '@/components/ui/SelectMenu';
import { TableMatrixCard } from '@/components/ui/TableMatrixCard';
import { TableReservationModal } from '@/components/ui/TableReservationModal';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
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

export function TablesManager({ restaurantId }: { restaurantId: string }) {
  const qc = useQueryClient();
  const { data: sections } = useQuery({
    queryKey: ['sections', restaurantId],
    queryFn: () => restaurantService.getSections(restaurantId),
    enabled: !!restaurantId,
  });
  const { data: tables } = useQuery({
    queryKey: ['tables', restaurantId],
    queryFn: () => restaurantService.getTables(restaurantId),
    enabled: !!restaurantId,
  });
  
  // Obtenemos las reservas para cruzarlas con las mesas
  const { data: reservationsData } = useRestaurantReservations(restaurantId, 0, 200);
  const reservations = reservationsData?.content || [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sections', restaurantId] });
    qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
  };

  // ── Forms ──
  const [tblNumber, setTblNumber] = useState('');
  const [tblCap, setTblCap] = useState(4);
  const [tblSection, setTblSection] = useState('');

  // ── Modal State ──
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);

  // ── Tabs State ──
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const addSection = useMutation({
    mutationFn: async ({ name, numTables }: { name: string, numTables: number }) => {
      const section = await restaurantService.addSection(restaurantId, { name, type: 'INTERIOR', capacity: numTables > 0 ? numTables * 4 : 100 });
      if (numTables > 0) {
        const promises = [];
        for (let i = 1; i <= numTables; i++) {
          promises.push(restaurantService.addTable(restaurantId, { tableNumber: String(i), capacity: 4, sectionId: section.id }));
        }
        await Promise.all(promises);
      }
      return section;
    },
    onSuccess: () => { invalidate(); toast.success('Ambiente agregado'); },
    onError: () => toast.error('No se pudo agregar el ambiente'),
  });
  const editSection = useMutation({
    mutationFn: ({ id, name }: { id: string, name: string }) => restaurantService.updateSection(restaurantId, id, { name }),
    onSuccess: () => { invalidate(); toast.success('Nombre actualizado'); },
    onError: () => toast.error('No se pudo actualizar'),
  });
  const delSection = useMutation({
    mutationFn: (id: string) => restaurantService.deleteSection(restaurantId, id),
    onSuccess: () => { invalidate(); toast.success('Ambiente eliminado'); },
    onError: () => toast.error('No se pudo eliminar'),
  });
  const addTable = useMutation({
    mutationFn: (sectionIdToUse: string | undefined) => restaurantService.addTable(restaurantId, { tableNumber: tblNumber.trim(), capacity: tblCap, sectionId: sectionIdToUse }),
    onSuccess: () => { invalidate(); setTblNumber(''); setTblCap(4); toast.success('Mesa agregada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo agregar la mesa'),
  });
  const delTable = useMutation({
    mutationFn: (id: string) => restaurantService.deleteTable(restaurantId, id),
    onSuccess: () => { invalidate(); toast.success('Mesa eliminada'); },
    onError: () => toast.error('No se pudo eliminar'),
  });

  const totalTables = tables?.length ?? 0;
  const totalSeats = (tables ?? []).reduce((s, t) => s + t.capacity, 0);

  const inputCls = 'border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  // Agrupar mesas por ambiente
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
  
  // Si no hay tab activo, seleccionamos el primero por defecto
  const currentTab = activeTabId 
    ? activeTabId 
    : (availableSections.length > 0 ? availableSections[0].id : (unassignedTables.length > 0 ? 'unassigned' : null));

  const currentSectionTables = currentTab === 'unassigned' ? unassignedTables : (currentTab ? tablesBySection[currentTab] || [] : []);
  
  const stats = { AVAILABLE: 0, OCCUPIED: 0, UPCOMING: 0, UNAVAILABLE: 0 };
  currentSectionTables.forEach(t => {
    stats[getTableStatus(t, reservations)]++;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="font-display text-base font-semibold text-gray-900 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-orange-500" /> Ambientes y Mesas
        </h2>
        <span className="text-xs font-medium text-gray-400">{totalTables} mesas · {totalSeats} asientos</span>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Define los ambientes (Salón, Terraza, VIP) y gestiona tus mesas visualmente.
      </p>

      {/* ── Gestión Rápida ── */}
      <div className="bg-gray-50 rounded-xl p-4 mb-8 border border-gray-100 flex items-end gap-4 flex-wrap">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
            Agregar mesa al ambiente actual ({currentTab === 'unassigned' ? 'Sin asignar' : availableSections.find(s => s.id === currentTab)?.name})
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input value={tblNumber} onChange={(e) => setTblNumber(e.target.value)} placeholder="Ej. M1" className={cn(inputCls, 'w-24')} />
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-gray-400" />
              <input type="number" min={1} value={tblCap} onChange={(e) => setTblCap(Number(e.target.value))} className={cn(inputCls, 'w-20')} title="Capacidad" />
            </div>
            <button
              onClick={() => tblNumber.trim() && addTable.mutate(currentTab === 'unassigned' ? undefined : currentTab || undefined)}
              disabled={addTable.isPending || !tblNumber.trim() || !currentTab}
              className="inline-flex items-center gap-1.5 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all active:scale-95"
            >
              {addTable.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar Mesa
            </button>
          </div>
        </div>
      </div>

      {/* ── Matriz por Ambientes (Tabs) ── */}
      <div className="space-y-6">
        {/* Tabs Headers */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-gray-100">
          {availableSections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveTabId(section.id)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors",
                currentTab === section.id 
                  ? "border-orange-500 text-orange-600 bg-orange-50/50" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              {section.name}
              <span className={cn(
                "ml-2 px-1.5 py-0.5 rounded-full text-xs font-normal",
                currentTab === section.id ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"
              )}>
                {(tablesBySection[section.id] || []).length}
              </span>
            </button>
          ))}
          {unassignedTables.length > 0 && (
            <button
              onClick={() => setActiveTabId('unassigned')}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors",
                currentTab === 'unassigned' 
                  ? "border-gray-500 text-gray-800 bg-gray-100/50" 
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              )}
            >
              Sin asignar
              <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs font-normal bg-gray-200 text-gray-600">
                {unassignedTables.length}
              </span>
            </button>
          )}
          <button
            onClick={() => {
              const name = window.prompt("Nombre del nuevo ambiente:");
              if (name && name.trim()) {
                const numStr = window.prompt("¿Cuántas mesas quieres crear automáticamente en este ambiente?", "10");
                const numTables = parseInt(numStr || "0", 10);
                addSection.mutate({ name: name.trim(), numTables: isNaN(numTables) ? 0 : numTables });
              }
            }}
            className="flex items-center justify-center px-3 py-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-t-lg transition-colors border-b-2 border-transparent"
            title="Agregar ambiente"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Content */}
        {currentTab && (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-semibold text-gray-900 text-lg">
                  {currentTab === 'unassigned' ? 'Sin ambiente asignado' : availableSections.find(s => s.id === currentTab)?.name}
                </h3>
                {currentTab !== 'unassigned' && (
                  <button 
                    onClick={() => {
                      const currentName = availableSections.find(s => s.id === currentTab)?.name;
                      const name = window.prompt("Editar nombre de ambiente:", currentName);
                      if (name && name.trim() && name !== currentName) {
                        editSection.mutate({ id: currentTab, name: name.trim() });
                      }
                    }}
                    className="text-xs text-orange-500 hover:underline flex items-center gap-1"
                  >
                    Editar nombre
                  </button>
                )}
              </div>
              {currentTab !== 'unassigned' && (
                <button onClick={() => window.confirm("¿Seguro que deseas eliminar este ambiente?") && delSection.mutate(currentTab)} className="text-xs text-red-500 hover:underline">
                  Eliminar ambiente
                </button>
              )}
            </div>

            {/* Legend Bar */}
            <div className="flex items-center gap-4 text-xs font-bold border-b border-gray-200 pb-3 mb-4 overflow-x-auto whitespace-nowrap">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-green-200 bg-green-50 text-green-700">
                <div className="w-2 h-2 rounded-full bg-[#22c55e]"></div>
                {stats.AVAILABLE} Disponibles
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-red-200 bg-red-50 text-red-700">
                <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
                {stats.OCCUPIED} Ocupados
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-yellow-200 bg-yellow-50 text-yellow-700">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                {stats.UPCOMING} Reservados
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                0 No Disponible
              </div>
            </div>

            {(() => {
              const unassigned = reservations.filter(r => !r.tableId && r.sectionId === currentTab && (r.status === 'PENDING' || r.status === 'CONFIRMED'));
              if (unassigned.length === 0) return null;
              return (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-start gap-2 text-sm text-orange-800">
                  <div className="mt-0.5 font-bold text-orange-600">!</div>
                  <div>
                    <p className="font-semibold">Tienes {unassigned.length} reserva(s) en este ambiente sin mesa asignada.</p>
                    <p className="text-orange-700 opacity-90 text-xs mt-0.5">Ve a la pestaña general de "Reservas" en tu menú lateral para asignarles una mesa específica.</p>
                  </div>
                </div>
              );
            })()}

            {currentSectionTables.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 italic">No hay mesas en este ambiente.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 border-l border-t border-gray-200 bg-white">
                {currentSectionTables.map(t => (
                  <div key={t.id} className="relative group/delete border-r border-b border-gray-200 p-2 sm:p-3 aspect-square flex items-center justify-center bg-white">
                    <TableMatrixCard
                      table={t}
                      reservations={reservations.filter(r => r.tableId === t.id)}
                      onClick={() => setSelectedTable(t)}
                    />
                    <button 
                      onClick={() => delTable.mutate(t.id)} 
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 opacity-0 group-hover/delete:opacity-100 transition-opacity z-10"
                      title="Eliminar mesa"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                
                {/* Empty filler cells to complete the grid visually if needed (optional, just let it wrap naturally) */}
              </div>
            )}
          </div>
        )}
      </div>

      <TableReservationModal
        isOpen={!!selectedTable}
        onClose={() => setSelectedTable(null)}
        table={selectedTable}
        reservations={selectedTable ? reservations.filter(r => r.tableId === selectedTable.id) : []}
        restaurantId={restaurantId}
      />
    </div>
  );
}
