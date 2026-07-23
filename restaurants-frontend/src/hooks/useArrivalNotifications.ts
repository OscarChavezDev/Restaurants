import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useManagedReservations } from '@/hooks/useReservations';
import { todayLocal } from '@/utils/formatters';

/** S14-04: avisa al dueño (toast) cuando una reserva de hoy pasa a ARRIVED. */
export function useArrivalNotifications() {
  const { reservations } = useManagedReservations({ refetchInterval: 20000 });
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    const today = todayLocal();
    const arrivedToday = reservations.filter((r) => r.status === 'ARRIVED' && r.reservationDate === today);
    const arrivedIds = new Set(arrivedToday.map((r) => r.id));

    if (seenRef.current === null) {
      // Primera carga: solo establece la base, no notifica retroactivamente.
      seenRef.current = arrivedIds;
      return;
    }

    arrivedToday.forEach((r) => {
      if (!seenRef.current!.has(r.id)) {
        toast.success(`${r.customerName} llegó · mesa para ${r.partySize}`, { icon: '🔔', duration: 6000 });
      }
    });
    seenRef.current = arrivedIds;
  }, [reservations]);
}
