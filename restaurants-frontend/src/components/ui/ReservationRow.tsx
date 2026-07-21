'use client';

import { Calendar, CheckCircle, XCircle, CheckCheck, UserX, Star, Info } from 'lucide-react';
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
    <div className="group relative overflow-hidden bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-neutral-800 shadow-sm hover:border-gray-200 dark:hover:border-neutral-700 transition-all duration-300 p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      {/* Decorative left border */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 opacity-0 group-hover:opacity-100 transition-opacity",
        res.status === 'PENDING' ? "bg-amber-500" :
        res.status === 'CONFIRMED' ? "bg-blue-500" :
        res.status === 'COMPLETED' ? "bg-emerald-500" :
        res.status === 'CANCELLED' || res.status === 'NO_SHOW' ? "bg-red-500" : "bg-orange-500"
      )} />

      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <Calendar className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-bold text-gray-900 dark:text-white truncate">{res.customerName}</h3>
            <span className="hidden sm:inline text-xs text-gray-300 dark:text-gray-600">|</span>
            <code className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-50 dark:bg-neutral-800 px-2 py-0.5 rounded truncate">
              {res.confirmationCode}
            </code>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            <span className="text-gray-900 dark:text-gray-200">{formatDate(res.reservationDate)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{formatTime(res.startTime)}</span>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <span>{res.partySize} personas</span>
          </div>
          {(res.customerPhone || res.restaurantName) && (
            <div className="mt-2 flex items-center gap-3 text-xs font-medium">
              {res.restaurantName && (
                <span className="text-orange-600 dark:text-orange-400 tracking-tight flex items-center gap-1">
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

      <div className="flex items-center gap-2 flex-wrap lg:flex-shrink-0 lg:justify-end mt-2 lg:mt-0">
        <span className={cn('inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase shadow-sm', STATUS_COLORS[res.status])}>
          {STATUS_LABELS[res.status]}
        </span>

        {canManage && res.status === 'PENDING' && (
          <button
            onClick={() => onConfirm(res.id)}
            disabled={confirmPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-60 disabled:active:scale-100"
          >
            <CheckCircle className="h-3.5 w-3.5" /> Confirmar
          </button>
        )}

        {canManage && res.status === 'CONFIRMED' && (
          <>
            <button
              onClick={() => onComplete(res.id)}
              disabled={completePending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-xs font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-60 disabled:active:scale-100"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Completar
            </button>
            <button
              onClick={() => onNoShow(res.id)}
              disabled={noShowPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700 text-xs font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-60 disabled:active:scale-100"
            >
              <UserX className="h-3.5 w-3.5" /> No asistió
            </button>
          </>
        )}

        {(res.status === 'PENDING' || res.status === 'CONFIRMED') && (
          <button
            onClick={() => onCancel(res.id)}
            disabled={cancelPending}
            className="inline-flex items-center justify-center p-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors active:scale-95 disabled:opacity-60 disabled:active:scale-100"
            title="Cancelar reserva"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => onViewDetails(res)}
          className="inline-flex items-center justify-center p-1.5 bg-gray-50 dark:bg-neutral-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-xl transition-colors active:scale-95"
          title="Ver detalles completos"
        >
          <Info className="h-4 w-4" />
        </button>

        {!canManage && res.status === 'COMPLETED' && onReview && (
          <button
            onClick={() => onReview(res.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white text-xs font-bold rounded-xl transition-colors active:scale-95"
          >
            <Star className="h-3.5 w-3.5 fill-white/20" /> Reseñar
          </button>
        )}
      </div>
    </div>
  );
}
