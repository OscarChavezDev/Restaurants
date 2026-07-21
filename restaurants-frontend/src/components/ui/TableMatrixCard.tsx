'use client';

import { Users, Clock } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { RestaurantTable } from '@/types/restaurant';
import type { Reservation } from '@/types/reservation';
import { isBefore, isAfter, parse, addMinutes, isSameDay } from 'date-fns';

interface Props {
  table: RestaurantTable;
  reservations: Reservation[];
  onClick: () => void;
}

export function TableMatrixCard({ table, reservations, onClick }: Props) {
  const today = new Date();
  
  const activeReservations = reservations.filter(r => {
    if (r.status !== 'PENDING' && r.status !== 'CONFIRMED') return false;
    const rDate = parse(r.reservationDate, 'yyyy-MM-dd', new Date());
    return isSameDay(rDate, today);
  });

  let status: 'AVAILABLE' | 'OCCUPIED' | 'UPCOMING' | 'UNAVAILABLE' = 'AVAILABLE';
  let nextReservation: Reservation | null = null;

  for (const res of activeReservations) {
    const startTime = parse(`${res.reservationDate} ${res.startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    const endTime = res.endTime 
      ? parse(`${res.reservationDate} ${res.endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())
      : addMinutes(startTime, 120);

    const bufferStart = addMinutes(startTime, -15);

    if (isAfter(today, bufferStart) && isBefore(today, endTime)) {
      status = 'OCCUPIED';
      nextReservation = res;
      break;
    } else if (isBefore(today, bufferStart)) {
      status = 'UPCOMING';
      if (!nextReservation || isBefore(startTime, parse(`${nextReservation.reservationDate} ${nextReservation.startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date()))) {
        nextReservation = res;
      }
    }
  }

  if (table.currentStatus === 'OCCUPIED' || table.currentStatus === 'UNAVAILABLE') {
    status = table.currentStatus as 'OCCUPIED' | 'UNAVAILABLE';
  }

  const statusConfig = {
    AVAILABLE: {
      bg: 'bg-emerald-500/10 dark:!bg-emerald-500/[0.08]',
      border: 'border-emerald-500/20 dark:!border-emerald-500/15',
      text: 'text-emerald-600 dark:text-emerald-400',
      dot: 'bg-emerald-500',
      hover: 'hover:bg-emerald-500/20 dark:hover:!bg-emerald-500/[0.15]',
      label: 'Libre',
    },
    OCCUPIED: {
      bg: 'bg-red-500/10 dark:!bg-red-500/[0.08]',
      border: 'border-red-500/20 dark:!border-red-500/15',
      text: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500',
      hover: 'hover:bg-red-500/20 dark:hover:!bg-red-500/[0.15]',
      label: 'Ocupada',
    },
    UPCOMING: {
      bg: 'bg-amber-500/10 dark:!bg-amber-500/[0.08]',
      border: 'border-amber-500/20 dark:!border-amber-500/15',
      text: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
      hover: 'hover:bg-amber-500/20 dark:hover:!bg-amber-500/[0.15]',
      label: 'Reservada',
    },
    UNAVAILABLE: {
      bg: 'bg-gray-500/10 dark:!bg-white/[0.03]',
      border: 'border-gray-300/50 dark:!border-white/10',
      text: 'text-gray-500 dark:text-gray-500',
      dot: 'bg-gray-400',
      hover: 'hover:bg-gray-500/15 dark:hover:!bg-white/[0.06]',
      label: 'No disponible',
    },
  };

  const s = statusConfig[status];
  const tableLabel = table.tableNumber.toLowerCase().startsWith('mesa') ? table.tableNumber : table.tableNumber;

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 w-full h-full min-h-[72px]',
        s.bg, s.border, s.text, s.hover
      )}
    >
      {/* Status dot */}
      <div className={cn('absolute top-1.5 right-1.5 w-2 h-2 rounded-full', s.dot)} />

      {/* Table number */}
      <span className="font-bold text-base tabular-nums">{tableLabel}</span>
      
      {/* Capacity */}
      <span className="flex items-center gap-0.5 text-[10px] font-medium opacity-60 mt-0.5">
        <Users className="h-2.5 w-2.5" /> {table.capacity}
      </span>

      {/* Reservation count badge */}
      {activeReservations.length > 0 && (
        <div className="absolute -top-1.5 -left-1.5 h-4.5 w-4.5 min-w-[18px] rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm px-1">
          {activeReservations.length}
        </div>
      )}
    </button>
  );
}
