'use client';

import { X, Clock, User, Phone, CheckCircle, XCircle, UserX, CheckSquare, Armchair, LayoutGrid, Link2Off } from 'lucide-react';
import type { RestaurantTable } from '@/types/restaurant';
import type { Reservation } from '@/types/reservation';
import { useConfirmReservation, useCancelReservation, useCompleteReservation, useNoShowReservation, useAssignTable } from '@/hooks/useReservations';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { isSameDay, parse } from 'date-fns';

import { restaurantService } from '@/services/restaurantService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTable | null;
  /** Todas las reservas del restaurante — este modal filtra las de hoy: las ya
   *  asignadas a esta mesa y las de la misma sección que aún no tienen mesa. */
  reservations: Reservation[];
  restaurantId: string;
}

export function TableReservationModal({ isOpen, onClose, table, reservations, restaurantId }: Props) {
  const qc = useQueryClient();
  const confirmMut = useConfirmReservation();
  const cancelMut = useCancelReservation();
  const completeMut = useCompleteReservation();
  const noShowMut = useNoShowReservation();
  const assignMut = useAssignTable();

  const statusMut = useMutation({
    mutationFn: (status: string) => restaurantService.updateTableStatus(restaurantId, table!.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  if (!isOpen || !table) return null;

  const today = new Date();
  const isActiveToday = (r: Reservation) =>
    (r.status === 'PENDING' || r.status === 'CONFIRMED') &&
    isSameDay(parse(r.reservationDate, 'yyyy-MM-dd', new Date()), today);

  const assignedReservations = reservations.filter((r) => r.tableId === table.id && isActiveToday(r));
  // Solo reservas ya CONFIRMADAS pueden ser candidatas a mesa — una reserva PENDING
  // todavía puede caerse (no se presentó a pagar, el dueño la rechazó, etc.), así
  // que asignarle mesa antes de confirmar reservaría el espacio de más.
  // La sección es opcional al reservar: si el cliente no eligió una, la reserva
  // es candidata para CUALQUIER mesa (no solo las de una sección que nunca eligió).
  const candidateReservations = reservations.filter(
    (r) => !r.tableId && (!r.sectionId || r.sectionId === table.sectionId) &&
      r.status === 'CONFIRMED' && isSameDay(parse(r.reservationDate, 'yyyy-MM-dd', new Date()), today)
  );
  // Solo se puede asignar una reserva a esta mesa si su grupo cabe en la capacidad de la mesa
  // (todavía no soportamos combinar varias mesas para un solo grupo grande).
  const assignableReservations = candidateReservations.filter((r) => r.partySize <= table.capacity);
  const oversizedReservations = candidateReservations.filter((r) => r.partySize > table.capacity);

  const tableLabel = table.tableNumber.toLowerCase().startsWith('mesa') ? table.tableNumber : `Mesa ${table.tableNumber}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" aria-hidden="true">
      <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-neutral-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
              <Armchair className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg text-gray-900 dark:text-white">
                {tableLabel}
              </h3>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Capacidad: {table.capacity} personas</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Estado Manual */}
        <div className="p-5 border-b border-gray-100 dark:border-neutral-800">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
            Estado Manual (Walk-ins)
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => statusMut.mutate('AVAILABLE')}
              disabled={statusMut.isPending}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                table.currentStatus === 'AVAILABLE' || (!table.currentStatus && true) // Default fallback
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full mb-1.5 shadow-sm", table.currentStatus === 'AVAILABLE' ? "bg-emerald-500" : "bg-gray-400 dark:bg-gray-500")} />
              <span className="text-xs font-bold">Libre</span>
            </button>
            
            <button
              onClick={() => statusMut.mutate('OCCUPIED')}
              disabled={statusMut.isPending}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                table.currentStatus === 'OCCUPIED'
                  ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                  : "border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full mb-1.5 shadow-sm", table.currentStatus === 'OCCUPIED' ? "bg-red-500" : "bg-gray-400 dark:bg-gray-500")} />
              <span className="text-xs font-bold">Ocupada</span>
            </button>

            <button
              onClick={() => statusMut.mutate('UNAVAILABLE')}
              disabled={statusMut.isPending}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                table.currentStatus === 'UNAVAILABLE'
                  ? "border-gray-800 dark:border-gray-500 bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-white"
                  : "border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              <div className={cn("w-2.5 h-2.5 rounded-full mb-1.5 shadow-sm", table.currentStatus === 'UNAVAILABLE' ? "bg-gray-800 dark:bg-gray-400" : "bg-gray-400 dark:bg-gray-500")} />
              <span className="text-xs font-bold whitespace-nowrap">No Disp.</span>
            </button>
          </div>
        </div>

        {/* Reservas de la sección sin mesa asignada: candidatas para esta mesa */}
        {(assignableReservations.length > 0 || oversizedReservations.length > 0) && (
          <div className="p-5 border-b border-gray-100 dark:border-neutral-800 bg-amber-50/40 dark:bg-amber-500/5">
            <h3 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-3">
              Sin mesa en este ambiente — hoy
            </h3>
            {assignableReservations.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Ninguna cabe en esta mesa (ver abajo).</p>
            )}
            <div className="space-y-2">
              {assignableReservations.map((res) => (
                <div key={res.id} className="flex items-center justify-between gap-3 bg-white dark:bg-neutral-900 rounded-xl p-3 border border-amber-100 dark:border-amber-500/10">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {res.startTime.substring(0, 5)} · {res.customerName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{res.partySize} pax</p>
                  </div>
                  <button
                    onClick={() => assignMut.mutate({ id: res.id, tableId: table.id }, {
                      onSuccess: () => toast.success('Mesa asignada'),
                      onError: () => toast.error('No se pudo asignar la mesa'),
                    })}
                    disabled={assignMut.isPending}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors active:scale-95"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" /> Asignar
                  </button>
                </div>
              ))}
            </div>
            {oversizedReservations.length > 0 && (
              <p className="text-[11px] text-amber-700/80 dark:text-amber-400/70 mt-3">
                {oversizedReservations.length} reserva(s) más en este ambiente no caben aquí (necesitan mesa para más de {table.capacity}).
              </p>
            )}
          </div>
        )}

        {/* Reservas */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            Reservas para hoy en esta mesa
          </h3>

          {assignedReservations.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-neutral-500">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 opacity-50" />
              </div>
              <p className="text-sm font-medium">No hay reservas asignadas a esta mesa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignedReservations.map(res => (
                <div key={res.id} className="border border-gray-100 dark:border-neutral-800 rounded-2xl p-4 bg-white dark:bg-neutral-900 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500/20" />
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-bold text-gray-900 dark:text-white text-lg tabular-nums">
                        {res.startTime.substring(0,5)}
                      </span>
                      {res.endTime && <span className="text-gray-400 dark:text-gray-500 text-sm font-medium tabular-nums">- {res.endTime.substring(0,5)}</span>}
                    </div>
                    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', STATUS_COLORS[res.status])}>
                      {STATUS_LABELS[res.status]}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4 bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <User className="h-4 w-4 text-gray-400" /> {res.customerName} <span className="text-gray-400 text-xs">({res.partySize} pax)</span>
                    </div>
                    {res.customerPhone && (
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Phone className="h-4 w-4 text-gray-400" /> {res.customerPhone}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {res.status === 'PENDING' && (
                      <button
                        onClick={() => confirmMut.mutate(res.id, {
                          onSuccess: () => toast.success('Confirmada'),
                          onError: () => toast.error('No se pudo confirmar'),
                        })}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors active:scale-95"
                      >
                        <CheckCircle className="h-4 w-4" /> Confirmar
                      </button>
                    )}
                    {res.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => completeMut.mutate(res.id, {
                            onSuccess: () => toast.success('Completada'),
                            onError: () => toast.error('No se pudo completar'),
                          })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-xs font-bold rounded-xl transition-colors active:scale-95"
                        >
                          <CheckSquare className="h-4 w-4" /> Asistió
                        </button>
                        <button
                          onClick={() => noShowMut.mutate(res.id, {
                            onSuccess: () => toast.success('Marcada como No-Show'),
                            onError: () => toast.error('No se pudo marcar'),
                          })}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl transition-colors active:scale-95"
                        >
                          <UserX className="h-4 w-4" /> No Show
                        </button>
                      </>
                    )}
                    {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                      <button
                        onClick={() => cancelMut.mutate({ id: res.id, reason: 'Cancelada por el restaurante' }, {
                          onSuccess: () => toast.success('Cancelada'),
                          onError: () => toast.error('No se pudo cancelar'),
                        })}
                        className="flex-shrink-0 flex items-center justify-center p-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors active:scale-95"
                        title="Cancelar reserva"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => assignMut.mutate({ id: res.id, tableId: undefined }, {
                        onSuccess: () => toast.success('Mesa quitada'),
                        onError: () => toast.error('No se pudo quitar la mesa'),
                      })}
                      disabled={assignMut.isPending}
                      className="flex-shrink-0 flex items-center justify-center p-2 bg-gray-50 dark:bg-neutral-800 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors active:scale-95 disabled:opacity-50"
                      title="Quitar de esta mesa"
                    >
                      <Link2Off className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
