'use client';

import { Calendar, CheckCircle, XCircle, CheckCheck, UserX, Star } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDate, formatTime, STATUS_LABELS, STATUS_COLORS } from '@/utils/formatters';
import type { Reservation } from '@/types/reservation';

interface ReservationRowProps {
  res: Reservation;
  canManage: boolean;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onComplete: (id: string) => void;
  onNoShow: (id: string) => void;
  onReview?: (id: string) => void;
  confirmPending: boolean;
  cancelPending: boolean;
  completePending: boolean;
  noShowPending: boolean;
  onViewDetails: (res: Reservation) => void;
}

export function ReservationRow({
  res,
  canManage,
  onConfirm,
  onCancel,
  onComplete,
  onNoShow,
  onReview,
  confirmPending,
  cancelPending,
  completePending,
  noShowPending,
  onViewDetails,
}: ReservationRowProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
          <Calendar className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900">{res.customerName}</p>
            <span className="text-xs text-gray-400">|</span>
            <p className="text-xs text-gray-400 font-mono">{res.confirmationCode}</p>
          </div>
          <p className="text-sm text-gray-500">
            {formatDate(res.reservationDate)} · {formatTime(res.startTime)} · {res.partySize} personas
          </p>
          {res.customerPhone && (
            <p className="text-xs text-gray-400">{res.customerPhone}</p>
          )}
          {res.restaurantName && (
            <p className="text-xs text-orange-500 font-medium">{res.restaurantName}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-shrink-0 sm:justify-end">
        <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', STATUS_COLORS[res.status])}>
          {STATUS_LABELS[res.status]}
        </span>

        {canManage && res.status === 'PENDING' && (
          <button
            onClick={() => onConfirm(res.id)}
            disabled={confirmPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Confirmar
          </button>
        )}

        {canManage && res.status === 'CONFIRMED' && (
          <>
            <button
              onClick={() => onComplete(res.id)}
              disabled={completePending}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Completar
            </button>
            <button
              onClick={() => onNoShow(res.id)}
              disabled={noShowPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
            >
              <UserX className="h-3.5 w-3.5" /> No se presentó
            </button>
          </>
        )}

        {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
          <button
            onClick={() => onCancel(res.id)}
            disabled={cancelPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
          >
            <XCircle className="h-3.5 w-3.5" /> Cancelar
          </button>
        )}

        <button
          onClick={() => onViewDetails(res)}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors"
        >
          Ver detalles
        </button>

        {!canManage && res.status === 'COMPLETED' && onReview && (
          <button
            onClick={() => onReview(res.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white text-xs font-medium rounded-lg transition-colors"
          >
            <Star className="h-3.5 w-3.5" /> Dejar reseña
          </button>
        )}
      </div>
    </div>
  );
}
