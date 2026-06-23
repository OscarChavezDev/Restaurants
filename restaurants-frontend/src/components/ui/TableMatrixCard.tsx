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
  // Solo consideramos reservas de hoy que estén pendientes o confirmadas
  const today = new Date();
  
  const activeReservations = reservations.filter(r => {
    if (r.status !== 'PENDING' && r.status !== 'CONFIRMED') return false;
    const rDate = parse(r.reservationDate, 'yyyy-MM-dd', new Date());
    return isSameDay(rDate, today);
  });

  // Calcular el estado actual de la mesa
  let status: 'AVAILABLE' | 'OCCUPIED' | 'UPCOMING' | 'UNAVAILABLE' = 'AVAILABLE';
  let nextReservation: Reservation | null = null;

  for (const res of activeReservations) {
    const startTime = parse(`${res.reservationDate} ${res.startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date());
    const endTime = res.endTime 
      ? parse(`${res.reservationDate} ${res.endTime}`, 'yyyy-MM-dd HH:mm:ss', new Date())
      : addMinutes(startTime, 120); // 2 horas por defecto

    const bufferStart = addMinutes(startTime, -15); // La mesa se marca ocupada/reservada 15 mins antes

    if (isAfter(today, bufferStart) && isBefore(today, endTime)) {
      status = 'OCCUPIED';
      nextReservation = res;
      break;
    } else if (isBefore(today, bufferStart)) {
      status = 'UPCOMING';
      // Quedarnos con la reserva más próxima
      if (!nextReservation || isBefore(startTime, parse(`${nextReservation.reservationDate} ${nextReservation.startTime}`, 'yyyy-MM-dd HH:mm:ss', new Date()))) {
        nextReservation = res;
      }
    }
  }

  if (table.currentStatus === 'OCCUPIED' || table.currentStatus === 'UNAVAILABLE') {
    status = table.currentStatus as 'OCCUPIED' | 'UNAVAILABLE';
  }

  const bgColors = {
    AVAILABLE: 'bg-[#22c55e] hover:bg-[#16a34a]', // Verde
    OCCUPIED: 'bg-[#ef4444] hover:bg-[#dc2626]', // Rojo
    UPCOMING: 'bg-[#f59e0b] hover:bg-[#d97706]', // Amarillo
    UNAVAILABLE: 'bg-gray-400 hover:bg-gray-500', // Gris
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 aspect-square shadow-sm active:scale-95 w-full h-full',
        bgColors[status]
      )}
    >
      <span className="text-white font-bold text-sm md:text-base text-center px-1 break-words line-clamp-2">
        {table.tableNumber.toLowerCase().startsWith('mesa') ? table.tableNumber : `Mesa ${table.tableNumber}`}
      </span>
      <span className="text-white/80 text-[11px] font-medium mt-1 flex items-center gap-1">
        {table.capacity} asientos
      </span>

      {/* Indicador de número de reservas en el día (si hay más de 1) */}
      {activeReservations.length > 0 && (
        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-gray-900 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
          {activeReservations.length}
        </div>
      )}
    </button>
  );
}
