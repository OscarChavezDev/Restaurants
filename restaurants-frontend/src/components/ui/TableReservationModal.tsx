'use client';

import { X, Clock, User, Phone, CheckCircle, XCircle, UserX, CheckSquare } from 'lucide-react';
import type { RestaurantTable } from '@/types/restaurant';
import type { Reservation } from '@/types/reservation';
import { useConfirmReservation, useCancelReservation, useCompleteReservation, useNoShowReservation } from '@/hooks/useReservations';
import { STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  table: RestaurantTable | null;
  reservations: Reservation[];
  restaurantId: string;
}

import { restaurantService } from '@/services/restaurantService';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function TableReservationModal({ isOpen, onClose, table, reservations, restaurantId }: Props) {
  const qc = useQueryClient();
  const confirmMut = useConfirmReservation();
  const cancelMut = useCancelReservation();
  const completeMut = useCompleteReservation();
  const noShowMut = useNoShowReservation();

  const statusMut = useMutation({
    mutationFn: (status: string) => restaurantService.updateTableStatus(restaurantId, table!.id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tables', restaurantId] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  if (!isOpen || !table) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" aria-hidden="true">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-display font-semibold text-lg text-gray-900">
            Mesa {table.tableNumber}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-500">Estado manual (Walk-ins)</h3>
          <div className="flex gap-2">
            <button
              onClick={() => statusMut.mutate('AVAILABLE')}
              disabled={statusMut.isPending || table.currentStatus === 'AVAILABLE'}
              className="flex-1 py-1.5 text-xs font-semibold rounded border transition-colors disabled:opacity-50 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 disabled:border-green-500 disabled:bg-green-100"
            >
              Disponible
            </button>
            <button
              onClick={() => statusMut.mutate('OCCUPIED')}
              disabled={statusMut.isPending || table.currentStatus === 'OCCUPIED'}
              className="flex-1 py-1.5 text-xs font-semibold rounded border transition-colors disabled:opacity-50 border-red-200 text-red-700 bg-red-50 hover:bg-red-100 disabled:border-red-500 disabled:bg-red-100"
            >
              Ocupada
            </button>
            <button
              onClick={() => statusMut.mutate('UNAVAILABLE')}
              disabled={statusMut.isPending || table.currentStatus === 'UNAVAILABLE'}
              className="flex-1 py-1.5 text-xs font-semibold rounded border transition-colors disabled:opacity-50 border-gray-200 text-gray-700 bg-gray-50 hover:bg-gray-100 disabled:border-gray-500 disabled:bg-gray-100"
            >
              Cerrada
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">Reservas programadas para hoy</h3>
          
          {reservations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No hay reservas para esta mesa hoy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(res => (
                <div key={res.id} className="border border-gray-100 rounded-xl p-3 bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">{res.startTime.substring(0,5)}</span>
                      {res.endTime && <span className="text-gray-500 text-sm">- {res.endTime.substring(0,5)}</span>}
                    </div>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', STATUS_COLORS[res.status])}>
                      {STATUS_LABELS[res.status]}
                    </span>
                  </div>

                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-3.5 w-3.5" /> {res.customerName} ({res.partySize} pax)
                    </div>
                    {res.customerPhone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3.5 w-3.5" /> {res.customerPhone}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                    {res.status === 'PENDING' && (
                      <button
                        onClick={() => { confirmMut.mutate(res.id); toast.success('Confirmada'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <CheckCircle className="h-3.5 w-3.5" /> Confirmar
                      </button>
                    )}
                    {res.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => { completeMut.mutate(res.id); toast.success('Completada'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold rounded-lg transition-colors"
                        >
                          <CheckSquare className="h-3.5 w-3.5" /> Asistió
                        </button>
                        <button
                          onClick={() => { noShowMut.mutate(res.id); toast.success('Marcada como No-Show'); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold rounded-lg transition-colors"
                        >
                          <UserX className="h-3.5 w-3.5" /> No Show
                        </button>
                      </>
                    )}
                    {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
                      <button
                        onClick={() => { cancelMut.mutate({ id: res.id, reason: 'Cancelada por el restaurante' }); toast.success('Cancelada'); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold rounded-lg transition-colors ml-auto"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancelar
                      </button>
                    )}
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
