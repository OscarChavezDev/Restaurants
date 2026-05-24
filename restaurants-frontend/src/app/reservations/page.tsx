'use client';

import { useState } from 'react';
import { Search, Calendar, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useReservationByCode } from '@/hooks/useReservations';
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import { cn } from '@/utils/cn';

export default function ReservationLookupPage() {
  const [code, setCode] = useState('');
  const [search, setSearch] = useState('');

  const { data: reservation, isLoading, error } = useReservationByCode(search);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(code.toUpperCase().trim());
  };

  const StatusIcon = reservation?.status === 'CONFIRMED' ? CheckCircle
    : reservation?.status === 'CANCELLED' ? XCircle : Clock;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 py-14">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <Calendar className="h-12 w-12 text-orange-200 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-white mb-2">Consulta tu Reserva</h1>
          <p className="text-orange-100 mb-8">Ingresa el código de confirmación que recibiste</p>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Ej: RES-AB12CD34"
              className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 font-mono uppercase"
            />
            <button type="submit" className="px-6 py-3 bg-white text-orange-600 font-semibold rounded-xl hover:bg-orange-50 transition-colors">
              Buscar
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-600 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>

        {isLoading && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
            <div className="h-8 w-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-3">Buscando reserva...</p>
          </div>
        )}

        {error && search && (
          <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-center">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-1">No encontrada</h3>
            <p className="text-gray-500">No existe una reserva con el código <code className="font-mono bg-gray-100 px-1 rounded">{search}</code></p>
          </div>
        )}

        {reservation && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Status banner */}
            <div className={cn('p-4 flex items-center gap-3', {
              'bg-green-50': reservation.status === 'CONFIRMED',
              'bg-yellow-50': reservation.status === 'PENDING',
              'bg-red-50': reservation.status === 'CANCELLED',
              'bg-gray-50': reservation.status === 'COMPLETED' || reservation.status === 'NO_SHOW',
            })}>
              <StatusIcon className={cn('h-6 w-6', {
                'text-green-500': reservation.status === 'CONFIRMED',
                'text-yellow-500': reservation.status === 'PENDING',
                'text-red-500': reservation.status === 'CANCELLED',
                'text-gray-400': reservation.status === 'COMPLETED' || reservation.status === 'NO_SHOW',
              })} />
              <div>
                <p className="font-semibold text-gray-900">{STATUS_LABELS[reservation.status]}</p>
                <code className="text-xs text-gray-500 font-mono">{reservation.confirmationCode}</code>
              </div>
            </div>

            {/* Detalles */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Restaurante</p>
                  <p className="font-medium text-gray-900">{reservation.restaurantName || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-medium text-gray-900">{reservation.customerName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Fecha</p>
                  <p className="font-medium text-gray-900">{formatDate(reservation.reservationDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Hora</p>
                  <p className="font-medium text-gray-900">{formatTime(reservation.startTime)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Personas</p>
                  <p className="font-medium text-gray-900">{reservation.partySize}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Teléfono</p>
                  <p className="font-medium text-gray-900">{reservation.customerPhone}</p>
                </div>
              </div>
              {reservation.notes && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Notas</p>
                  <p className="text-gray-600 text-sm">{reservation.notes}</p>
                </div>
              )}
              {reservation.isEventRelated && (
                <div className="pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Vinculada al evento: {reservation.relatedEventName}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {!search && !isLoading && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Ingresa un código como <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">RES-XXXXXXXX</code></p>
          </div>
        )}
      </div>
    </div>
  );
}
