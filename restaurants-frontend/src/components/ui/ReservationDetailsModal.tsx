import { X, Calendar, User, AlignLeft, Info, DollarSign, AlertCircle } from 'lucide-react';
import { type Reservation } from '@/types/reservation';
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';

interface ReservationDetailsModalProps {
  reservation: Reservation | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReservationDetailsModal({ reservation, isOpen, onClose }: ReservationDetailsModalProps) {
  if (!isOpen || !reservation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="font-display text-lg font-semibold text-gray-900">
              Detalles de la Reserva
            </h3>
            <p className="text-sm text-gray-500 font-mono mt-0.5">
              Código: {reservation.confirmationCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          
          {/* Status badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">Estado actual:</span>
            <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[reservation.status])}>
              {STATUS_LABELS[reservation.status]}
            </span>
          </div>

          {/* Customer Info */}
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <User className="w-4 h-4 text-orange-500" />
              Datos del Cliente
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-gray-600">
              <p><strong className="text-gray-900 font-medium">Nombre:</strong> {reservation.customerName}</p>
              {reservation.customerPhone && (
                <p><strong className="text-gray-900 font-medium">Teléfono:</strong> {reservation.customerPhone}</p>
              )}
              {reservation.customerEmail && (
                <p><strong className="text-gray-900 font-medium">Email:</strong> {reservation.customerEmail}</p>
              )}
            </div>
          </section>

          {/* Reservation Info */}
          <section className="space-y-3">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Calendar className="w-4 h-4 text-orange-500" />
              Detalles de la Cita
            </h4>
            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-gray-600">
              <p><strong className="text-gray-900 font-medium">Fecha:</strong> {formatDate(reservation.reservationDate)}</p>
              <p><strong className="text-gray-900 font-medium">Hora:</strong> {formatTime(reservation.startTime)}</p>
              <p><strong className="text-gray-900 font-medium">Personas:</strong> {reservation.partySize}</p>
              {reservation.restaurantName && (
                <p><strong className="text-gray-900 font-medium">Restaurante:</strong> {reservation.restaurantName}</p>
              )}
            </div>
          </section>

          {/* Additional Notes */}
          {(reservation.notes || reservation.specialRequests) && (
            <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <AlignLeft className="w-4 h-4 text-orange-500" />
                Notas y Peticiones
              </h4>
              <div className="bg-orange-50/50 rounded-xl p-4 text-sm space-y-3 text-gray-700">
                {reservation.specialRequests && (
                  <div>
                    <strong className="block text-orange-800 font-medium mb-1">Peticiones especiales:</strong>
                    <p className="italic">"{reservation.specialRequests}"</p>
                  </div>
                )}
                {reservation.notes && (
                  <div>
                    <strong className="block text-orange-800 font-medium mb-1">Notas adicionales:</strong>
                    <p>{reservation.notes}</p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Payment & Event Info */}
          {(reservation.advanceAmount || reservation.isEventRelated || reservation.cancellationReason) && (
            <section className="space-y-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Info className="w-4 h-4 text-orange-500" />
                Información Adicional
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-2 text-gray-600">
                {reservation.advanceAmount != null && reservation.advanceAmount > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>
                      <strong className="text-gray-900 font-medium">Adelanto requerido:</strong> S/ {reservation.advanceAmount.toFixed(2)}
                      {reservation.paymentStatus && ` (${reservation.paymentStatus})`}
                    </span>
                  </div>
                )}
                {reservation.isEventRelated && reservation.relatedEventName && (
                  <p><strong className="text-gray-900 font-medium">Evento asociado:</strong> {reservation.relatedEventName}</p>
                )}
                {reservation.cancellationReason && (
                  <div className="flex gap-2 text-red-600 bg-red-50 p-2 rounded-lg mt-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-medium block">Motivo de cancelación:</strong>
                      <span>{reservation.cancellationReason}</span>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
