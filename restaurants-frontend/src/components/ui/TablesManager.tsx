'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus, Trash2, Loader2, Users, Pencil, X } from 'lucide-react';
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
  
  const { data: reservationsData } = useRestaurantReservations(restaurantId, 0, 200);
  const reservations = reservationsData?.content || [];

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['sections', restaurantId] });
    qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
  };

  // ── Forms ──
  const [tblNumber, setTblNumber] = useState('');
  const [tblCap, setTblCap] = useState(4);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [newSectionTables, setNewSectionTables] = useState(10);
  
  // ── Inline Editing State ──
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [confirmDeleteSectionId, setConfirmDeleteSectionId] = useState<string | null>(null);
  const [confirmDeleteTableId, setConfirmDeleteTableId] = useState<string | null>(null);

  // ── Modal State ──
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const selectedTable = tables?.find(t => t.id === selectedTableId) || null;
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
    onSuccess: () => { invalidate(); toast.success('Ambiente agregado'); setShowAddSection(false); setNewSectionName(''); setNewSectionTables(10); },
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
    onSuccess: () => { invalidate(); setTblNumber(''); setTblCap(4); setShowAddForm(false); toast.success('Mesa agregada'); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'No se pudo agregar la mesa'),
  });
  const delTable = useMutation({
    mutationFn: (id: string) => restaurantService.deleteTable(restaurantId, id),
    onSuccess: () => { invalidate(); toast.success('Mesa eliminada'); },
    onError: () => toast.error('No se pudo eliminar'),
  });

  const totalTables = tables?.length ?? 0;
  const totalSeats = (tables ?? []).reduce((s, t) => s + t.capacity, 0);

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

  const inputCls = 'w-full bg-gray-50 dark:!bg-white/[0.04] border border-gray-200 dark:!border-white/10 text-gray-900 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-gray-400';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center shrink-0">
            <LayoutGrid className="h-5 w-5" />
          </span>
          Ambientes y Mesas
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{totalTables} mesas · {totalSeats} asientos</span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-xl transition-all active:scale-95",
              showAddForm 
                ? "bg-gray-100 dark:!bg-white/5 text-gray-600 dark:text-gray-300" 
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/20"
            )}
          >
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showAddForm ? 'Cerrar' : 'Agregar mesa'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Define los ambientes y gestiona tus mesas visualmente.</p>

      {/* ── Add table form (collapsible) ── */}
      {showAddForm && (
        <div className="mb-6 p-4 rounded-2xl border border-orange-200/50 dark:!border-orange-500/20 bg-orange-50/30 dark:!bg-orange-500/5 animate-fade-in">
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Nueva mesa en: {currentTab === 'unassigned' ? 'Sin asignar' : availableSections.find(s => s.id === currentTab)?.name ?? 'Selecciona un ambiente'}
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Número / Nombre</label>
              <input value={tblNumber} onChange={(e) => setTblNumber(e.target.value)} placeholder="Ej. M1" className={cn(inputCls, 'w-28')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Capacidad</label>
              <input type="number" min={1} value={tblCap} onChange={(e) => setTblCap(Number(e.target.value))} className={cn(inputCls, 'w-20')} />
            </div>
            <button
              onClick={() => tblNumber.trim() && addTable.mutate(currentTab === 'unassigned' ? undefined : currentTab || undefined)}
              disabled={addTable.isPending || !tblNumber.trim() || !currentTab}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 shadow-sm shadow-orange-500/20"
            >
              {addTable.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Agregar
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0 scrollbar-hide mb-5">
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
            <span className={cn(
              "ml-1.5 text-xs",
              currentTab === section.id ? "text-white/70" : "text-gray-400 dark:text-gray-500"
            )}>
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
        
        {/* Add section button */}
        {!showAddSection ? (
          <button
            onClick={() => setShowAddSection(true)}
            className="flex items-center gap-1 px-3 py-2 text-gray-400 dark:text-gray-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:!bg-orange-500/10 rounded-xl transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" /> Ambiente
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-white dark:!bg-white/5 border border-gray-200 dark:!border-white/10 rounded-xl px-3 py-1.5 animate-fade-in">
            <input 
              value={newSectionName} 
              onChange={e => setNewSectionName(e.target.value)} 
              placeholder="Nombre" 
              className="bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 w-24 focus:outline-none" 
              autoFocus 
            />
            <input 
              type="number" 
              min={0} 
              value={newSectionTables} 
              onChange={e => setNewSectionTables(Number(e.target.value))} 
              className="bg-transparent text-sm text-gray-900 dark:text-white w-12 focus:outline-none text-center" 
              title="Nº mesas"
            />
            <span className="text-[10px] text-gray-400">mesas</span>
            <button 
              onClick={() => newSectionName.trim() && addSection.mutate({ name: newSectionName.trim(), numTables: newSectionTables })}
              disabled={!newSectionName.trim() || addSection.isPending}
              className="p-1 text-orange-500 hover:bg-orange-50 dark:hover:!bg-orange-500/10 rounded-lg disabled:opacity-40"
            >
              {addSection.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            </button>
            <button onClick={() => { setShowAddSection(false); setNewSectionName(''); }} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {currentTab && (
        <div>
          {/* Section actions + legend */}
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
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
            {currentTab !== 'unassigned' && (
              <div className="flex items-center gap-2">
                {editingSectionId === currentTab ? (
                  <div className="flex items-center gap-1 animate-fade-in">
                    <input
                      autoFocus
                      value={editingSectionName}
                      onChange={e => setEditingSectionName(e.target.value)}
                      className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded px-2 py-0.5 text-xs focus:outline-none focus:border-orange-500"
                    />
                    <button 
                      onClick={() => {
                        if (editingSectionName.trim() && editingSectionName !== availableSections.find(s => s.id === currentTab)?.name) {
                          editSection.mutate({ id: currentTab, name: editingSectionName.trim() });
                        }
                        setEditingSectionId(null);
                      }}
                      className="text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10 p-1 rounded"
                    >
                      Guardar
                    </button>
                    <button onClick={() => setEditingSectionId(null)} className="text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 p-1 rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => {
                      setEditingSectionName(availableSections.find(s => s.id === currentTab)?.name || '');
                      setEditingSectionId(currentTab);
                    }}
                    className="text-xs text-gray-400 hover:text-orange-500 flex items-center gap-1 transition-colors"
                  >
                    <Pencil className="h-3 w-3" /> Renombrar
                  </button>
                )}

                {confirmDeleteSectionId === currentTab ? (
                  <div className="flex items-center gap-1 text-xs animate-fade-in bg-red-50 dark:bg-red-500/10 text-red-600 rounded px-2 py-0.5">
                    ¿Seguro? 
                    <button onClick={() => { delSection.mutate(currentTab); setConfirmDeleteSectionId(null); }} className="font-bold hover:underline ml-1">Sí, eliminar</button>
                    <span className="text-gray-300 mx-0.5">|</span>
                    <button onClick={() => setConfirmDeleteSectionId(null)} className="hover:underline">Cancelar</button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setConfirmDeleteSectionId(currentTab)} 
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors ml-2"
                  >
                    <Trash2 className="h-3 w-3" /> Eliminar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Unassigned reservations alert */}
          {(() => {
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

          {/* Tables grid */}
          {currentSectionTables.length === 0 ? (
            <div className="text-center py-10">
              <LayoutGrid className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
              <p className="text-sm text-gray-400 dark:text-gray-500">No hay mesas en este ambiente.</p>
              <button onClick={() => setShowAddForm(true)} className="text-xs text-orange-500 hover:underline mt-1">+ Agregar mesa</button>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
              {currentSectionTables.map(t => (
                <div key={t.id} className="relative group/delete">
                  <TableMatrixCard
                    table={t}
                    reservations={reservations.filter(r => r.tableId === t.id)}
                    onClick={() => setSelectedTableId(t.id)}
                  />
                  {confirmDeleteTableId === t.id ? (
                    <div className="absolute -top-1.5 -right-1.5 flex items-center gap-0.5 bg-white dark:bg-neutral-800 rounded-full shadow-md border border-red-200 dark:border-red-900/50 p-0.5 z-10">
                      <button
                        onClick={() => { delTable.mutate(t.id); setConfirmDeleteTableId(null); }}
                        className="p-1 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Confirmar: eliminar mesa"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteTableId(null)}
                        className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
                        title="Cancelar"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteTableId(t.id)}
                      className="absolute -top-1.5 -right-1.5 bg-white dark:bg-neutral-800 rounded-full p-1 shadow-md border border-gray-200 dark:border-neutral-700 text-gray-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 z-10"
                      title="Eliminar mesa"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
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
