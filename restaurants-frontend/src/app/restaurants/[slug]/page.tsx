'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  MapPin, Star, Phone, Mail, Globe, Clock, Users, Wifi, Car,
  Wind, Accessibility, Calendar, ArrowLeft, Loader2, ChevronDown, ChevronUp, UtensilsCrossed, CheckCircle
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurants';
import { restaurantService } from '@/services/restaurantService';
import { useCreateReservation } from '@/hooks/useReservations';
import { useAuthStore } from '@/store/authStore';
import { createReservationSchema, type CreateReservationFormData } from '@/validations/restaurantSchema';
import { formatRating, formatDistance, DAY_LABELS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { MenuSection } from '@/features/restaurants/MenuSection';
import { ImageGallery } from '@/features/restaurants/ImageGallery';
import { PromotionsSection } from '@/features/restaurants/PromotionsSection';
import { RestaurantLogo } from '@/components/ui/RestaurantLogo';
import { RatingsSection } from '@/features/restaurants/RatingsSection';

const TODAY = new Date().toISOString().split('T')[0];

export default function RestaurantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data: restaurant, isLoading, error } = useRestaurantBySlug(slug);
  const createReservation = useCreateReservation();
  const [showReservationForm, setShowReservationForm] = useState(false);
  const [successReservation, setSuccessReservation] = useState<{ code: string } | null>(null);

  const { register, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<CreateReservationFormData>({
    resolver: zodResolver(createReservationSchema),
    defaultValues: {
      restaurantId: '',
      partySize: 2,
      reservationDate: TODAY,
      startTime: '13:00',
      customerName: user?.fullName ?? '',
      customerEmail: user?.email ?? '',
    },
  });

  const [availability, setAvailability] = useState<{ available: boolean; remainingSeats: number; totalCapacity: number; occupiedSeats: number } | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  const watchDate = watch('reservationDate');
  const watchTime = watch('startTime');
  const watchPartySize = watch('partySize');

  const [selectedDaySchedule, setSelectedDaySchedule] = useState<{ open: string, close: string, isClosed: boolean } | null>(null);

  useEffect(() => {
    if (restaurant && watchDate) {
      const [year, month, day] = watchDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const dayStr = days[localDate.getDay()];
      
      const schedule = restaurant.schedules?.find(s => s.dayOfWeek === dayStr);
      if (schedule) {
        setSelectedDaySchedule({
          open: schedule.openingTime,
          close: schedule.closingTime,
          isClosed: schedule.isClosed
        });
      } else {
        setSelectedDaySchedule({ open: '00:00', close: '23:59', isClosed: true });
      }
    }
  }, [restaurant, watchDate]);

  useEffect(() => {
    if (selectedDaySchedule && !selectedDaySchedule.isClosed) {
      const current = getValues('startTime');
      if (current < selectedDaySchedule.open || current > selectedDaySchedule.close) {
        setValue('startTime', selectedDaySchedule.open);
      }
    }
  }, [selectedDaySchedule, setValue, getValues]);

  useEffect(() => {
    if (restaurant && watchDate && watchTime && watchPartySize && showReservationForm) {
      const check = async () => {
        try {
          setCheckingAvailability(true);
          const result = await restaurantService.checkAvailability(restaurant.id, watchDate, watchTime, watchPartySize);
          setAvailability(result);
        } catch (err) {
          console.error('Error al consultar disponibilidad', err);
        } finally {
          setCheckingAvailability(false);
        }
      };
      
      const timeoutId = setTimeout(check, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [restaurant, watchDate, watchTime, watchPartySize, showReservationForm]);

  const onReserve = async (data: CreateReservationFormData) => {
    if (!restaurant) return;
    try {
      const reservation = await createReservation.mutateAsync({
        ...data,
        restaurantId: restaurant.id,
      });
      toast.success('¡Reserva creada con éxito!');
      setSuccessReservation({ code: reservation.confirmationCode });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al crear la reserva');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50">
      <div className="h-72 skeleton" />
      <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-10 skeleton rounded-2xl w-2/3" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    </div>
  );

  if (error || !restaurant) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <UtensilsCrossed className="h-12 w-12 text-gray-300 mb-4 mx-auto" />
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Restaurante no encontrado</h2>
        <Link href="/restaurants" className="text-orange-500 hover:underline">Ver todos los restaurantes</Link>
      </div>
    </div>
  );

  const features = [
    { show: restaurant.hasWifi, icon: Wifi, label: 'WiFi' },
    { show: restaurant.hasParking, icon: Car, label: 'Estacionamiento' },
    { show: restaurant.hasAirConditioning, icon: Wind, label: 'Aire acondicionado' },
    { show: restaurant.isAccessible, icon: Accessibility, label: 'Accesible' },
    { show: restaurant.acceptsEvents, icon: Calendar, label: 'Acepta eventos' },
    { show: restaurant.acceptsReservations, icon: Users, label: 'Acepta reservas' },
  ].filter(f => f.show);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="relative h-72 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
        {restaurant.coverImageUrl ? (
          <>
            {/* Hero difuminado: portadas de baja resolución lucen como fondo intencional */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.coverImageUrl}
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover scale-110 blur-[6px]"
            />
            <div className="absolute inset-0 bg-black/30" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20"><UtensilsCrossed className="h-32 w-32 text-orange-300" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute top-4 left-4">
          <Link href="/restaurants" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 rounded-xl text-sm font-medium text-gray-700 hover:bg-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="flex items-end gap-4">
            <RestaurantLogo name={restaurant.name} logoUrl={restaurant.logoUrl} className="h-16 w-16 rounded-2xl shadow-lg text-2xl" />
            <div>
              <h1 className="font-display text-3xl font-bold text-white">{restaurant.name}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="h-4 w-4 fill-yellow-400" />
                  <span className="text-white font-medium">{formatRating(restaurant.avgRating)}</span>
                  <span className="text-white/70 text-sm">({restaurant.totalRatings} reseñas)</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <MapPin className="h-4 w-4" />
                  {restaurant.district ? `${restaurant.district}, ` : ''}{restaurant.city}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Info principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Categorías */}
            {restaurant.categories?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {restaurant.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">{cat}</span>
                ))}
              </div>
            )}

            {/* Descripción */}
            {restaurant.description && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-display text-lg font-semibold text-gray-900 mb-3">Sobre el restaurante</h2>
                <p className="text-gray-600 leading-relaxed">{restaurant.description}</p>
              </div>
            )}

            {/* Características */}
            {features.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="font-display text-lg font-semibold text-gray-900 mb-4">Características</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {features.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl">
                      <Icon className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Horarios */}
            {restaurant.schedules?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-500" /> Horarios
                </h2>
                <div className="space-y-2">
                  {restaurant.schedules.map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {s.isClosed ? <span className="text-red-500">Cerrado</span> : `${s.openingTime} - ${s.closingTime}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Promociones */}
            <PromotionsSection restaurantId={restaurant.id} />

            {/* Menú */}
            <MenuSection restaurantId={restaurant.id} />

            {/* Galería */}
            <ImageGallery restaurantId={restaurant.id} />

            {/* Reseñas */}
            <RatingsSection restaurantId={restaurant.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Reserva */}
            {restaurant.acceptsReservations && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-display text-lg font-semibold text-gray-900">Hacer una reserva</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">Para {restaurant.minReservationSize}–{restaurant.maxReservationSize} personas</p>

                {successReservation ? (
                  <div className="bg-green-50 rounded-xl p-6 text-center border border-green-100">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-green-800 font-bold text-lg mb-1">¡Reserva enviada!</h3>
                    <p className="text-green-700 text-sm mb-4">Tu solicitud de reserva está pendiente de confirmación. Guarda este código para consultarla o cancelarla:</p>
                    <div className="bg-white rounded-lg py-3 px-4 shadow-sm border border-green-100 mb-5">
                      <code className="text-xl font-mono text-gray-900 font-bold select-all tracking-wider">{successReservation.code}</code>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Link href={`/reservations?code=${successReservation.code}`} className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-colors block text-center">
                        Ver estado de reserva
                      </Link>
                      <button onClick={() => { setSuccessReservation(null); setShowReservationForm(false); }} className="w-full py-2.5 bg-white border border-green-200 text-green-700 hover:bg-green-50 font-medium rounded-xl text-sm transition-colors">
                        Cerrar
                      </button>
                    </div>
                  </div>
                ) : !showReservationForm ? (
                  <button
                    onClick={() => setShowReservationForm(true)}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    Reservar mesa
                  </button>
                ) : (
                  <form onSubmit={handleSubmit(onReserve)} className="space-y-3">
                    {availability && (
                      <div className={cn("p-3 rounded-xl text-sm", availability.available ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                        {availability.available ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>¡Hay mesas disponibles! (Quedan {availability.remainingSeats} asientos)</span>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <Wind className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-medium">Poca disponibilidad</p>
                              <p className="text-xs opacity-90">El restaurante está lleno para esta hora (capacidad: {availability.totalCapacity}, ocupados: {availability.occupiedSeats}). Tu reserva quedará pendiente de revisión especial.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tu nombre *</label>
                      <input {...register('customerName')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      {errors.customerName && <p className="text-xs text-red-500 mt-0.5">{errors.customerName.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Teléfono *</label>
                      <input {...register('customerPhone')} placeholder="+51 962 000 000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                      {errors.customerPhone && <p className="text-xs text-red-500 mt-0.5">{errors.customerPhone.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                      <input {...register('customerEmail')} type="email" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Fecha *</label>
                      <input {...register('reservationDate')} type="date" min={TODAY} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hora *</label>
                      <input 
                        {...register('startTime')} 
                        type="time" 
                        min={selectedDaySchedule && !selectedDaySchedule.isClosed ? selectedDaySchedule.open : undefined}
                        max={selectedDaySchedule && !selectedDaySchedule.isClosed ? selectedDaySchedule.close : undefined}
                        className={cn("w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2", 
                          selectedDaySchedule && !selectedDaySchedule.isClosed && (watchTime < selectedDaySchedule.open || watchTime > selectedDaySchedule.close)
                            ? "border-red-300 focus:ring-red-500 bg-red-50"
                            : "border-gray-200 focus:ring-orange-500"
                        )} 
                      />
                      {selectedDaySchedule?.isClosed ? (
                        <p className="text-xs text-red-500 mt-1">El restaurante está cerrado este día.</p>
                      ) : selectedDaySchedule ? (
                        <>
                          <p className="text-xs text-gray-400 mt-1">Horario: {selectedDaySchedule.open} - {selectedDaySchedule.close}</p>
                          {(watchTime < selectedDaySchedule.open || watchTime > selectedDaySchedule.close) && (
                            <p className="text-xs text-red-500 mt-1 font-medium">La hora debe estar dentro del horario de atención.</p>
                          )}
                        </>
                      ) : null}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Personas *</label>
                      <input {...register('partySize', { valueAsNumber: true })} type="number" min={restaurant.minReservationSize} max={restaurant.maxReservationSize} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
                      <textarea {...register('notes')} rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button 
                        type="submit" 
                        disabled={createReservation.isPending || (selectedDaySchedule?.isClosed ?? false) || (selectedDaySchedule != null && !selectedDaySchedule.isClosed && (watchTime < selectedDaySchedule.open || watchTime > selectedDaySchedule.close))} 
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-colors"
                      >
                        {createReservation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        {createReservation.isPending ? 'Reservando...' : 'Confirmar'}
                      </button>
                      <button type="button" onClick={() => setShowReservationForm(false)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Contacto */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Contacto</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <span>{restaurant.address}, {restaurant.city}</span>
                </div>
                {restaurant.phone && (
                  <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                    <Phone className="h-4 w-4 text-orange-500" />
                    {restaurant.phone}
                  </a>
                )}
                {restaurant.email && (
                  <a href={`mailto:${restaurant.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                    <Mail className="h-4 w-4 text-orange-500" />
                    {restaurant.email}
                  </a>
                )}
                {restaurant.website && (
                  <a href={restaurant.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-gray-600 hover:text-orange-600 transition-colors">
                    <Globe className="h-4 w-4 text-orange-500" />
                    Sitio web
                  </a>
                )}
              </div>
            </div>

            {/* Capacidad */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 text-orange-500" />
                <span>Capacidad: <strong>{restaurant.totalCapacity}</strong> personas</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
