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
    <div className="group relative overflow-hidden bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-200/60 dark:border-gray-800 shadow-md hover:shadow-lg hover:border-orange-300 dark:hover:border-orange-500/30 transition-all duration-300 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Decorative left border */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 ring-1 ring-orange-100 dark:ring-orange-500/20">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 truncate">{res.customerName}</h3>
            <span className="hidden sm:inline text-xs text-gray-300 dark:text-gray-600">|</span>
            <code className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-1.5 py-0.5 rounded truncate">
              {res.confirmationCode}
            </code>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-200">{formatDate(res.reservationDate)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{formatTime(res.startTime)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{res.partySize} personas</span>
          </div>
          {(res.customerPhone || res.restaurantName) && (
            <div className="mt-1.5 flex items-center gap-3 text-xs">
              {res.restaurantName && (
                <span className="font-semibold text-orange-600 dark:text-orange-400 tracking-tight flex items-center gap-1">
                  {res.restaurantName}
                </span>
              )}
              {res.customerPhone && (
                <span className="text-gray-500 dark:text-gray-500">{res.customerPhone}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap sm:flex-shrink-0 sm:justify-end mt-2 sm:mt-0">
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm', STATUS_COLORS[res.status])}>
          {STATUS_LABELS[res.status]}
        </span>

        {canManage && res.status === 'PENDING' && (
          <button
            onClick={() => onConfirm(res.id)}
            disabled={confirmPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <CheckCircle className="h-4 w-4" /> Confirmar
          </button>
        )}

        {canManage && res.status === 'CONFIRMED' && (
          <>
            <button
              onClick={() => onComplete(res.id)}
              disabled={completePending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <CheckCheck className="h-4 w-4" /> Completar
            </button>
            <button
              onClick={() => onNoShow(res.id)}
              disabled={noShowPending}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-500 hover:bg-gray-600 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
            >
              <UserX className="h-4 w-4" /> No asistió
            </button>
          </>
        )}

        {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
          <button
            onClick={() => onCancel(res.id)}
            disabled={cancelPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-500 text-red-600 hover:text-white dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500 dark:hover:text-white border border-red-200 dark:border-red-500/20 hover:border-transparent text-xs font-semibold rounded-xl transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <XCircle className="h-4 w-4" /> Cancelar
          </button>
        )}

        <button
          onClick={() => onViewDetails(res)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
        >
          Detalles
        </button>

        {!canManage && res.status === 'COMPLETED' && onReview && (
          <button
            onClick={() => onReview(res.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-yellow-500/25"
          >
            <Star className="h-4 w-4 fill-white/20" /> Reseñar
          </button>
        )}
      </div>
    </div>
  );
}
