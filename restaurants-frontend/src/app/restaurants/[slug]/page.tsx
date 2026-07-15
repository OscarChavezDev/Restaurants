'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin, Star, Phone, Mail, Globe, Clock, Users, Wifi, Car,
  Wind, Accessibility, Calendar, ArrowLeft, UtensilsCrossed
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { formatRating, formatTime, DAY_LABELS } from '@/utils/formatters';
import { ReservationModal } from '@/features/restaurants/ReservationModal';
import { cn } from '@/utils/cn';
import { MenuSection } from '@/features/restaurants/MenuSection';
import { ImageGallery } from '@/features/restaurants/ImageGallery';
import { PromotionsSection } from '@/features/restaurants/PromotionsSection';
import { RestaurantLogo } from '@/components/ui/RestaurantLogo';
import { RatingsSection } from '@/features/restaurants/RatingsSection';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { NearbyEventsSection } from '@/features/restaurants/NearbyEventsSection';
import { NearbyLodgingSection } from '@/features/restaurants/NearbyLodgingSection';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-xl bg-gray-100 animate-pulse" />,
});

export default function RestaurantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data: restaurant, isLoading, error } = useRestaurantBySlug(slug);
  const [reserveOpen, setReserveOpen] = useState(false);

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

  // ── Horario: día de hoy y "abierto ahora" ──
  const DAY_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const now = new Date();
  const todayKey = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][now.getDay()];
  const sortedSchedules = [...(restaurant.schedules ?? [])].sort(
    (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
  );
  const todaySchedule = restaurant.schedules?.find((s) => s.dayOfWeek === todayKey);
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const toMin = (t?: string) => (t ? Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]) : 0);
  const isOpenNow = !!todaySchedule && !todaySchedule.isClosed
    && nowMin >= toMin(todaySchedule.openingTime) && nowMin <= toMin(todaySchedule.closingTime);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover */}
      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-[#7C2D12] via-[#C2410C] to-[#E8590C] dark:from-[#240B03] dark:via-[#5A1F0C] dark:to-[#7C2D12]">
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
          <div className="absolute inset-0 flex items-center justify-center opacity-20"><UtensilsCrossed className="h-32 w-32 text-white" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="absolute top-4 left-4">
          <button onClick={() => window.history.length > 2 ? router.back() : router.push('/restaurants')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium shadow-sm bg-white text-orange-600 hover:bg-orange-50 border border-white/50 dark:bg-white/10 dark:text-white dark:border-white/20 dark:backdrop-blur-md dark:hover:bg-white/20 transition-all cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>

        <FavoriteButton restaurantId={restaurant.id} className="absolute top-4 right-4 h-10 w-10 z-10" />

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
            {sortedSchedules.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" /> Horarios
                  </h2>
                  <span className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                    isOpenNow ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  )}>
                    <span className={cn('h-2 w-2 rounded-full', isOpenNow ? 'bg-green-500 animate-pulse' : 'bg-gray-400')} />
                    {isOpenNow ? 'Abierto ahora' : 'Cerrado ahora'}
                  </span>
                </div>
                <div className="space-y-1">
                  {sortedSchedules.map(s => {
                    const isToday = s.dayOfWeek === todayKey;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                          isToday
                            ? 'bg-orange-50 dark:bg-orange-500/10 ring-1 ring-orange-500/30'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        )}
                      >
                        <span className={cn('flex items-center gap-2.5', isToday ? 'font-semibold text-gray-900 dark:text-gray-50' : 'font-medium text-gray-700 dark:text-gray-300')}>
                          <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', s.isClosed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-green-500')} />
                          {DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}
                          {isToday && <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Hoy</span>}
                        </span>
                        <span className={cn(
                          s.isClosed ? 'text-red-500' : isToday ? 'text-orange-600 dark:text-orange-400 font-semibold' : 'text-gray-500 dark:text-gray-400'
                        )}>
                          {s.isClosed ? 'Cerrado' : `${formatTime(s.openingTime)} – ${formatTime(s.closingTime)}`}
                        </span>
                      </div>
                    );
                  })}
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
            <RatingsSection
              restaurantId={restaurant.id}
              canReply={!!user && (user.userId === restaurant.ownerId || user.role === 'ADMIN')}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Reserva (S9-02: abre el modal moderno) */}
            {restaurant.acceptsReservations && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
                <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-1">Hacer una reserva</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Para {restaurant.minReservationSize}–{restaurant.maxReservationSize} personas</p>
                <button
                  onClick={() => setReserveOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                >
                  <Calendar className="h-4 w-4" /> Reservar mesa
                </button>
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

                {/* Mapa de ubicación */}
                {!!restaurant.latitude && !!restaurant.longitude && (
                  <div className="pt-1">
                    <LocationMap lat={restaurant.latitude} lng={restaurant.longitude} />
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                    >
                      <MapPin className="h-4 w-4" /> Cómo llegar
                    </a>
                  </div>
                )}
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

            {/* Ecosistema: eventos y hospedaje cercanos (se ocultan solas si no hay datos) */}
            <NearbyEventsSection restaurantId={restaurant.id} />
            <NearbyLodgingSection restaurantId={restaurant.id} />
          </div>
        </div>
      </div>

      {/* Modal de reserva moderno (Sprint 9) */}
      <ReservationModal restaurant={restaurant} open={reserveOpen} onClose={() => setReserveOpen(false)} />
    </div>
  );
}
