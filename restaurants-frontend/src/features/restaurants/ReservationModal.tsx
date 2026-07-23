'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  X, Calendar, Clock, Users, Phone, CheckCircle, Loader2,
  ArrowLeft, ArrowRight, Armchair, Info, Minus, Plus, Wallet, LayoutGrid, Hourglass, UtensilsCrossed,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCreateReservation } from '@/hooks/useReservations';
import { restaurantService } from '@/services/restaurantService';
import { reservationConfigService, estimateAdvance, estimateTables } from '@/services/reservationConfigService';
import { waitlistService } from '@/services/waitlistService';
import { TimePicker } from '@/components/ui/TimePicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { GoogleLoginButton } from '@/components/ui/GoogleLoginButton';
import { formatTime, todayLocal } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import type { Restaurant } from '@/types/restaurant';

const TODAY = todayLocal();
const DAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

interface Availability {
  available: boolean;
  remainingSeats: number;
  totalCapacity: number;
  occupiedSeats: number;
}

const inputCls =
  'w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition';
const labelCls = 'block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5';

export function ReservationModal({
  restaurant,
  open,
  onClose,
}: {
  restaurant: Restaurant;
  open: boolean;
  onClose: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const createReservation = useCreateReservation();

  const [step, setStep] = useState(0);
  const [date, setDate] = useState(TODAY);
  const [time, setTime] = useState('13:00');
  const [partySize, setPartySize] = useState(2);
  const [sectionId, setSectionId] = useState<string | undefined>(undefined);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [success, setSuccess] = useState<{ code: string } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [joiningWaitlist, setJoiningWaitlist] = useState(false);
  const [orderQty, setOrderQty] = useState<Record<string, number>>({});

  // Secciones del local (S9-04)
  const { data: sections } = useQuery({
    queryKey: ['sections', restaurant.id],
    queryFn: () => restaurantService.getSections(restaurant.id),
    enabled: open && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  // Config de reservas del restaurante (Sprint 10)
  const { data: config } = useQuery({
    queryKey: ['reservation-config', restaurant.id],
    queryFn: () => reservationConfigService.get(restaurant.id),
    enabled: open && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  // Platos disponibles para el pre-pedido (S10-07)
  const { data: dishes } = useQuery({
    queryKey: ['dishes-restaurant', restaurant.id],
    queryFn: () => restaurantService.getRestaurantDishes(restaurant.id),
    enabled: open && isAuthenticated,
    staleTime: 1000 * 60 * 5,
  });

  const activeSections = useMemo(() => (sections ?? []).filter((s) => s.isActive), [sections]);
  // La sección se ofrece solo si hay secciones Y el dueño lo permite (S10).
  const hasSections = activeSections.length > 0 && (config?.allowSectionSelection ?? true);
  const hasTerms = !!config?.termsAndConditions?.trim();
  const hasDishes = (dishes?.length ?? 0) > 0;

  // Pre-pedido: items y total
  const orderItems = useMemo(
    () => Object.entries(orderQty).filter(([, q]) => q > 0).map(([dishId, quantity]) => ({ dishId, quantity })),
    [orderQty]
  );
  const orderTotal = useMemo(
    () => (dishes ?? []).reduce((sum, d) => sum + (orderQty[d.id] ?? 0) * d.price, 0),
    [dishes, orderQty]
  );

  // Pasos dinámicos
  const steps = useMemo(
    () => ['Detalles', ...(hasSections ? ['Sección'] : []), ...(hasDishes ? ['Pre-pedido'] : []), 'Contacto', 'Resumen'],
    [hasSections, hasDishes]
  );

  // Horario del día elegido
  const daySchedule = useMemo(() => {
    if (!date) return null;
    const [y, m, d] = date.split('-').map(Number);
    const dayStr = DAYS[new Date(y, m - 1, d).getDay()];
    const s = restaurant.schedules?.find((x) => x.dayOfWeek === dayStr);
    return s ? { open: s.openingTime, close: s.closingTime, isClosed: s.isClosed } : { open: '00:00', close: '23:59', isClosed: true };
  }, [date, restaurant.schedules]);

  const timeOutOfRange =
    !!daySchedule && !daySchedule.isClosed && (time < daySchedule.open || time > daySchedule.close);
  const detailsInvalid =
    !date || !time || partySize < 1 || (daySchedule?.isClosed ?? false) || timeOutOfRange;

  // Rango válido de comensales (clamp para evitar valores como "0100").
  const minP = restaurant.minReservationSize || 1;
  const maxP = restaurant.maxReservationSize || 500;
  const clampParty = (n: number) => Math.max(minP, Math.min(maxP, Number.isNaN(n) ? minP : n));

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setStep(0);
      setSuccess(null);
      setAvailability(null);
      setTermsAccepted(false);
      setWaitlistJoined(false);
      setOrderQty({});
    }
  }, [open]);

  // Consulta de disponibilidad (debounce) en el paso de detalles
  useEffect(() => {
    if (!open || !isAuthenticated || detailsInvalid) { setAvailability(null); return; }
    const id = setTimeout(async () => {
      try {
        const r = await restaurantService.checkAvailability(restaurant.id, date, time, partySize);
        setAvailability(r);
      } catch { /* silencioso */ }
    }, 450);
    return () => clearTimeout(id);
  }, [open, isAuthenticated, restaurant.id, date, time, partySize, detailsInvalid]);

  // Si la sección elegida deja de caber (subió el nº de personas), se descarta.
  useEffect(() => {
    if (!sectionId) return;
    const sec = activeSections.find((s) => s.id === sectionId);
    if (sec && sec.capacity < partySize) setSectionId(undefined);
  }, [partySize, sectionId, activeSections]);

  if (!open) return null;

  const selectedSection = activeSections.find((s) => s.id === sectionId);

  // Estimaciones (Sprint 10): mesas y adelanto.
  const tablesEstimate = config ? estimateTables(config, partySize) : 0;
  // Con pre-pedido, el adelanto es % del total del pedido (S10-07).
  const advanceEstimate = config
    ? (orderItems.length > 0 && config.requiresAdvancePayment
        ? +(orderTotal * (config.largeGroupAdvancePercent / 100)).toFixed(2)
        : estimateAdvance(config, partySize))
    : 0;

  const handleConfirm = async () => {
    if (!user) return;
    try {
      const reservation = await createReservation.mutateAsync({
        restaurantId: restaurant.id,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: phone,
        reservationDate: date,
        startTime: time,
        partySize,
        sectionId,
        notes: notes.trim() || undefined,
        termsAccepted,
        orderItems: orderItems.length > 0 ? orderItems : undefined,
      });
      toast.success('¡Reserva creada con éxito!');
      setSuccess({ code: reservation.confirmationCode });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al crear la reserva');
    }
  };

  const handleJoinWaitlist = async () => {
    if (!user) return;
    try {
      setJoiningWaitlist(true);
      await waitlistService.join({
        restaurantId: restaurant.id,
        customerName: user.fullName,
        customerEmail: user.email,
        customerPhone: phone || '—',
        reservationDate: date,
        startTime: time,
        partySize,
      });
      setWaitlistJoined(true);
      toast.success('Te anotamos en la lista de espera. Te avisaremos si se libera un cupo.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'No se pudo anotar en la lista de espera');
    } finally {
      setJoiningWaitlist(false);
    }
  };

  // T&C: si el restaurante los exige, hay que aceptarlos para confirmar.
  const confirmDisabled = createReservation.isPending || !phone.trim() || (hasTerms && !termsAccepted);

  const goNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const goBack = () => setStep((s) => Math.max(s - 1, 0));
  const isLastStep = step === steps.length - 1;
  const currentLabel = steps[step];

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose} aria-hidden />

      <div className="relative w-full sm:max-w-md max-h-[92vh] flex flex-col bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-slide-up">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-selva-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-3 flex-shrink-0">
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900 dark:text-gray-50">Reservar mesa</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{restaurant.name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Gate de acceso: no autenticado / rol incorrecto / éxito / formulario ── */}
        {hasHydrated && !isAuthenticated ? (
          <div className="px-6 py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-500/15 text-orange-600">
              <Calendar className="h-7 w-7" />
            </div>
            <h3 className="font-display text-base font-bold text-gray-900 dark:text-gray-50 mb-1">Inicia sesión para reservar</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Las reservas son para clientes registrados. Ingresa con Google y continúa en segundos.
            </p>
            <div className="flex justify-center">
              <GoogleLoginButton text="continue_with" />
            </div>
          </div>
        ) : hasHydrated && isAuthenticated && (user?.role === 'DEVELOPER' || user?.role === 'RESTAURANTE_OWNER') ? (
          <div className="px-6 py-8 text-center">
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${user.role === 'DEVELOPER' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400' : 'bg-orange-100 dark:bg-orange-500/15 text-orange-600 dark:text-orange-400'}`}>
              {user.role === 'DEVELOPER' ? (
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M16 18L22 12L16 6"/><path d="M8 6L2 12L8 18"/></svg>
              ) : (
                <UtensilsCrossed className="h-7 w-7" />
              )}
            </div>
            <h3 className="font-display text-base font-bold text-gray-900 dark:text-gray-50 mb-1">
              {user.role === 'DEVELOPER' ? 'No disponible para cuentas de desarrollador' : 'No disponible para propietarios de restaurante'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
              {user.role === 'DEVELOPER'
                ? 'Tu cuenta tiene acceso a la API de RestoPoint. Las reservas son exclusivas para clientes. Usa una cuenta Google para reservar.'
                : 'Como propietario, gestiona tu establecimiento desde el dashboard. Para reservar como cliente usa una cuenta Google distinta.'}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href={user.role === 'DEVELOPER' ? '/dashboard/api-keys' : '/dashboard'}
                onClick={onClose}
                className={`w-full py-2.5 font-bold rounded-xl text-sm transition-all text-white ${user.role === 'DEVELOPER' ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700' : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'}`}>
                {user.role === 'DEVELOPER' ? 'Ver mis API Keys' : 'Ir al Dashboard'}
              </Link>
              <button onClick={onClose}
                className="w-full py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl text-sm transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        ) : success ? (
          /* ── Éxito ── */
          <div className="px-6 py-8 text-center">
            <CheckCircle className="w-14 h-14 text-selva-500 mx-auto mb-3" />
            <h3 className="font-display text-lg font-bold text-gray-900 dark:text-gray-50 mb-1">¡Reserva enviada!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Está pendiente de confirmación. Guarda este código para consultarla o cancelarla:
            </p>
            <div className="rounded-xl py-3 px-4 mb-5 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
              <code className="text-xl font-mono font-bold tracking-wider text-gray-900 dark:text-gray-50 select-all">{success.code}</code>
            </div>
            <div className="flex flex-col gap-2">
              <Link href={`/reservations?code=${success.code}`} className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl text-sm transition-colors">
                Ver estado de la reserva
              </Link>
              <button onClick={onClose} className="w-full py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-xl text-sm transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-1.5 px-6 pb-3 flex-shrink-0">
              {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-1.5 flex-1">
                  <div className={cn(
                    'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
                    i < step ? 'bg-selva-500 text-white' : i === step ? 'bg-orange-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  )}>
                    {i < step ? <CheckCircle className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className={cn('h-0.5 flex-1 rounded-full', i < step ? 'bg-selva-500' : 'bg-gray-100 dark:bg-gray-700')} />}
                </div>
              ))}
            </div>

            {/* Cuerpo del paso (scrollable) */}
            <div className="px-6 py-2 overflow-y-auto flex-1">
              {currentLabel === 'Detalles' && (
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}><Calendar className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Fecha</label>
                    <DatePicker min={TODAY} value={date} onChange={setDate} fullWidth />
                  </div>
                  <div>
                    <label className={labelCls}><Clock className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Hora</label>
                    <TimePicker
                      value={time}
                      onChange={setTime}
                      fullWidth
                      className={cn('rounded-xl px-3 py-2.5', timeOutOfRange ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-500/10' : '')}
                    />
                    {daySchedule?.isClosed ? (
                      <p className="text-xs text-red-500 mt-1">El restaurante está cerrado este día.</p>
                    ) : daySchedule ? (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Horario: {formatTime(daySchedule.open)} – {formatTime(daySchedule.close)}
                        {timeOutOfRange && <span className="text-red-500 font-medium"> · fuera de horario</span>}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label className={labelCls}><Users className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Personas</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPartySize((p) => clampParty(p - 1))}
                        disabled={partySize <= minP}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Menos personas"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={minP}
                        max={maxP}
                        value={partySize}
                        onChange={(e) => setPartySize(clampParty(parseInt(e.target.value, 10)))}
                        className={cn(inputCls, 'text-center font-semibold')}
                      />
                      <button
                        type="button"
                        onClick={() => setPartySize((p) => clampParty(p + 1))}
                        disabled={partySize >= maxP}
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Más personas"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Para {minP}–{maxP} personas</p>
                  </div>

                  {availability && !detailsInvalid && (
                    <div className={cn('flex items-start gap-2 p-3 rounded-xl text-sm', availability.available ? 'bg-selva-50 text-selva-700 dark:bg-selva-500/10 dark:text-selva-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300')}>
                      {availability.available ? <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> : <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                      <span>
                        {availability.available
                          ? `¡Hay mesas disponibles! Quedan ${availability.remainingSeats} asientos.`
                          : `Sin cupo suficiente para esta hora (ocupados ${availability.occupiedSeats}/${availability.totalCapacity}).`}
                      </span>
                    </div>
                  )}

                  {/* Lista de espera (S11-05): solo si no hay cupo */}
                  {availability && !availability.available && !detailsInvalid && (
                    waitlistJoined ? (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-selva-50 dark:bg-selva-500/10 text-selva-700 dark:text-selva-300 text-sm">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        Estás en la lista de espera. Te avisaremos si se libera un cupo.
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleJoinWaitlist}
                        disabled={joiningWaitlist}
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-300 dark:border-orange-500/40 text-orange-700 dark:text-orange-300 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-500/10 disabled:opacity-60 transition-colors"
                      >
                        {joiningWaitlist ? <Loader2 className="h-4 w-4 animate-spin" /> : <Hourglass className="h-4 w-4" />}
                        Anotarme en lista de espera
                      </button>
                    )
                  )}
                </div>
              )}

              {currentLabel === 'Sección' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Elige una sección del local (opcional) — para <strong>{partySize}</strong> {partySize === 1 ? 'persona' : 'personas'}.
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {activeSections.map((s) => {
                      const active = sectionId === s.id;
                      const tooSmall = s.capacity < partySize;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={tooSmall}
                          title={tooSmall ? `Capacidad ${s.capacity}: no alcanza para ${partySize} personas` : undefined}
                          onClick={() => setSectionId(active ? undefined : s.id)}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-2xl border p-3.5 text-left transition-all',
                            tooSmall
                              ? 'opacity-50 cursor-not-allowed border-gray-200 dark:border-gray-700'
                              : active
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 ring-1 ring-orange-500 active:scale-95'
                                : 'border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50 dark:hover:bg-gray-700/50 active:scale-95'
                          )}
                        >
                          <Armchair className={cn('h-4 w-4', active ? 'text-orange-500' : 'text-gray-400')} />
                          <span className={cn('text-sm font-medium', active ? 'text-orange-700 dark:text-orange-300' : 'text-gray-700 dark:text-gray-200')}>{s.name}</span>
                          <span className={cn('text-xs', tooSmall ? 'text-red-400 dark:text-red-400' : 'text-gray-400 dark:text-gray-500')}>
                            {s.capacity} pers.{tooSmall ? ' · insuficiente' : ''}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {activeSections.every((s) => s.capacity < partySize) && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Ninguna sección tiene capacidad para {partySize} personas. Continúa sin preferencia: el restaurante acomodará varias mesas.</span>
                    </div>
                  )}
                  <button type="button" onClick={() => setSectionId(undefined)} className="text-xs font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    Sin preferencia
                  </button>
                </div>
              )}

              {currentLabel === 'Pre-pedido' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <UtensilsCrossed className="h-4 w-4 text-orange-500" /> Adelanta tu pedido (opcional).
                  </p>
                  <div className="space-y-2">
                    {(dishes ?? []).map((d) => {
                      const qty = orderQty[d.id] ?? 0;
                      return (
                        <div key={d.id} className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{d.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">S/ {d.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button type="button" onClick={() => setOrderQty((o) => ({ ...o, [d.id]: Math.max(0, (o[d.id] ?? 0) - 1) }))} disabled={qty <= 0}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 transition-colors">
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-50">{qty}</span>
                            <button type="button" onClick={() => setOrderQty((o) => ({ ...o, [d.id]: (o[d.id] ?? 0) + 1 }))}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {orderItems.length > 0 && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 text-sm font-semibold">
                      <span>Total del pre-pedido</span><span>S/ {orderTotal.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {currentLabel === 'Contacto' && (
                <div className="space-y-4">
                  {/* Datos del perfil de Google (solo lectura) */}
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Reservas como</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <div>
                    <label className={labelCls}><Phone className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />Teléfono *</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+51 962 000 000" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Notas (opcional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Alergias, ocasión especial, etc." className={cn(inputCls, 'resize-none')} />
                  </div>
                </div>
              )}

              {currentLabel === 'Resumen' && (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
                    <SummaryRow icon={Calendar} label="Fecha" value={new Date(date + 'T00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })} />
                    <SummaryRow icon={Clock} label="Hora" value={formatTime(time)} />
                    <SummaryRow icon={Users} label="Personas" value={`${partySize}`} />
                    {selectedSection && <SummaryRow icon={Armchair} label="Sección" value={selectedSection.name} />}
                    {tablesEstimate > 0 && <SummaryRow icon={LayoutGrid} label="Mesas estimadas" value={`${tablesEstimate}`} />}
                    {orderItems.length > 0 && <SummaryRow icon={UtensilsCrossed} label="Pre-pedido" value={`S/ ${orderTotal.toFixed(2)}`} />}
                    <SummaryRow icon={Phone} label="Teléfono" value={phone || '—'} />
                    {config?.requiresAdvancePayment && (
                      <SummaryRow icon={Wallet} label="Adelanto estimado" value={advanceEstimate > 0 ? `S/ ${advanceEstimate.toFixed(2)}` : '—'} />
                    )}
                  </div>

                  {config?.requiresAdvancePayment && advanceEstimate > 0 && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs">
                      <Wallet className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Este restaurante solicita un <strong>adelanto estimado de S/ {advanceEstimate.toFixed(2)}</strong>. El monto final lo confirma el restaurante.</span>
                    </div>
                  )}

                  {/* Términos y condiciones (S10-04) */}
                  {hasTerms && (
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5">Términos y condiciones</p>
                      <div className="max-h-24 overflow-y-auto text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line mb-2">
                        {config?.termsAndConditions}
                      </div>
                      <label className="flex items-start gap-2 cursor-pointer">
                        <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-orange-500" />
                        <span className="text-xs text-gray-700 dark:text-gray-200">He leído y acepto los términos y condiciones.</span>
                      </label>
                    </div>
                  )}

                  {!hasTerms && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-300 text-xs">
                      <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span>Tu reserva quedará <strong>pendiente de confirmación</strong>.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer / navegación */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
              {step > 0 ? (
                <button onClick={goBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
                  <ArrowLeft className="h-4 w-4" /> Atrás
                </button>
              ) : <span />}

              {isLastStep ? (
                <button
                  onClick={handleConfirm}
                  disabled={confirmDisabled}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                >
                  {createReservation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {createReservation.isPending ? 'Reservando…' : 'Confirmar reserva'}
                </button>
              ) : (
                <button
                  onClick={goNext}
                  disabled={currentLabel === 'Detalles' && detailsInvalid}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                >
                  Siguiente <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5">
      <span className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Icon className="h-4 w-4 text-orange-500" /> {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 text-right capitalize">{value}</span>
    </div>
  );
}
