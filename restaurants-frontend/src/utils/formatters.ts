import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (date: string) =>
  format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: es });

/**
 * Fecha de HOY en zona horaria local, como 'yyyy-MM-dd'. NUNCA uses
 * `new Date().toISOString().slice(0, 10)` para esto: toISOString() convierte
 * a UTC primero, así que en Perú (UTC-5) entre ~19:00 y 23:59 devuelve la
 * fecha de MAÑANA en vez de la de hoy.
 */
export const todayLocal = () => format(new Date(), 'yyyy-MM-dd');

export const formatTime = (time: string) => {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 || 12;
  return `${h12}:${m} ${ampm}`;
};

export const formatCurrency = (amount: number, currency = 'PEN') =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);

export const formatRating = (rating: number) => rating.toFixed(1);

export const formatDistance = (km: number) =>
  km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
};

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  TEMPORARILY_CLOSED: 'Cerrado temporalmente',
  PENDING_APPROVAL: 'Pendiente de aprobación',
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmada',
  ARRIVED: 'Llegó',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No se presentó',
};

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-800',
  TEMPORARILY_CLOSED: 'bg-yellow-100 text-yellow-800',
  PENDING_APPROVAL: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  ARRIVED: 'bg-teal-100 text-teal-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
  NO_SHOW: 'bg-gray-200 text-gray-700',
};
