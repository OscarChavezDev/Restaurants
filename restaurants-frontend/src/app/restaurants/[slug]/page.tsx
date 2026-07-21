'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin, Star, Phone, Mail, Globe, Clock, Users, Wifi, Car,
  Wind, Accessibility, Calendar, ArrowLeft, UtensilsCrossed, ChevronDown
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { formatRating, formatTime, DAY_LABELS } from '@/utils/formatters';
import { ReservationModal } from '@/features/restaurants/ReservationModal';
import { cn } from '@/utils/cn';
import { MenuSection } from '@/features/restaurants/MenuSection';
import { ImageGallery } from '@/features/restaurants/ImageGallery';
import { PromotionsSection } from '@/features/restaurants/PromotionsSection';
import { RatingsSection } from '@/features/restaurants/RatingsSection';
import { FavoriteButton } from '@/components/ui/FavoriteButton';
import { NearbyEventsSection } from '@/features/restaurants/NearbyEventsSection';
import { NearbyLodgingSection } from '@/features/restaurants/NearbyLodgingSection';

const LocationMap = dynamic(() => import('@/components/ui/LocationMap'), {
  ssr: false,
  loading: () => <div className="h-[220px] rounded-xl bg-gray-100 animate-pulse" />,
});

const PRICE_SYMBOLS: Record<string, string> = { LOW: '$', MEDIUM: '$$', HIGH: '$$$' };

export default function RestaurantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data: restaurant, isLoading, error } = useRestaurantBySlug(slug);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [scheduleExpanded, setScheduleExpanded] = useState(false);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <UtensilsCrossed className="h-12 w-12 text-gray-300 dark:text-gray-700 mb-4 mx-auto" />
        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">Restaurante no encontrado</h2>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Cover Hero */}
      <div className="relative h-[280px] lg:h-[320px] overflow-hidden bg-gradient-to-br from-[#7C2D12] via-[#C2410C] to-[#E8590C] dark:from-[#240B03] dark:via-[#5A1F0C] dark:to-[#7C2D12]">
        {restaurant.coverImageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.coverImageUrl}
              alt={restaurant.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20"><UtensilsCrossed className="h-32 w-32 text-white" /></div>
        )}

        <div className="absolute top-4 left-4">
          <button onClick={() => window.history.length > 2 ? router.back() : router.push('/restaurants')} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium shadow-sm bg-white text-orange-600 hover:bg-orange-50 border border-white/50 dark:bg-white/10 dark:text-white dark:border-white/20 dark:backdrop-blur-md dark:hover:bg-white/20 transition-all cursor-pointer">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
        </div>

        <FavoriteButton restaurantId={restaurant.id} className="absolute top-3 right-16 h-9 w-9 z-10" />

        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="font-display text-3xl font-bold text-white drop-shadow-sm">{restaurant.name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400" />
              <span className="text-white font-medium">{formatRating(restaurant.avgRating)}</span>
              <span className="text-white/70 text-sm">({restaurant.totalRatings} reseñas)</span>
            </div>
            {restaurant.priceRange && PRICE_SYMBOLS[restaurant.priceRange] && (
              <span className="text-white/90 text-sm font-bold">{PRICE_SYMBOLS[restaurant.priceRange]}</span>
            )}
            <div className="flex items-center gap-1 text-white/80 text-sm">
              <MapPin className="h-4 w-4" />
              {restaurant.district ? `${restaurant.district}, ` : ''}{restaurant.city}
            </div>
          </div>
          {restaurant.categories?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {restaurant.categories.slice(0, 4).map((cat) => (
                <span key={cat} className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 xl:gap-12">

          {/* Flujo Principal */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-12">
            
            {/* 1. Highlights */}
            {features.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                {features.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                    <Icon className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 2. Información y Horarios (Logística) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Descripción */}
              {restaurant.description && (
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 tracking-tight">Sobre el restaurante</h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{restaurant.description}</p>
                  
                  {/* Capacidad */}
                  <div className="mt-6 flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="h-5 w-5 text-orange-500" />
                    <span>Capacidad: <strong className="text-gray-900 dark:text-gray-50">{restaurant.totalCapacity}</strong> personas</span>
                  </div>
                </div>
              )}

              {/* Horarios */}
              {sortedSchedules.length > 0 && (
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50 mb-4 tracking-tight flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-500" /> Horarios
                  </h2>
                  <div className="space-y-1">
                    {/* Siempre mostrar hoy */}
                    {todaySchedule && (
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm bg-orange-50 dark:bg-orange-500/10 ring-1 ring-orange-500/30">
                        <span className="flex items-center gap-2.5 font-semibold text-gray-900 dark:text-gray-50">
                          <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', todaySchedule.isClosed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-green-500')} />
                          {DAY_LABELS[todaySchedule.dayOfWeek] ?? todaySchedule.dayOfWeek}
                          <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">Hoy</span>
                        </span>
                        <span className={cn(todaySchedule.isClosed ? 'text-red-500' : 'text-orange-600 dark:text-orange-400 font-semibold')}>
                          {todaySchedule.isClosed ? 'Cerrado' : `${formatTime(todaySchedule.openingTime)} – ${formatTime(todaySchedule.closingTime)}`}
                        </span>
                      </div>
                    )}

                    {/* Resto de la semana colapsable */}
                    {scheduleExpanded && sortedSchedules.filter(s => s.dayOfWeek !== todayKey).map(s => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30"
                      >
                        <span className="flex items-center gap-2.5 font-medium text-gray-700 dark:text-gray-300">
                          <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', s.isClosed ? 'bg-gray-300 dark:bg-gray-600' : 'bg-green-500')} />
                          {DAY_LABELS[s.dayOfWeek] ?? s.dayOfWeek}
                        </span>
                        <span className={cn(s.isClosed ? 'text-red-500' : 'text-gray-500 dark:text-gray-400')}>
                          {s.isClosed ? 'Cerrado' : `${formatTime(s.openingTime)} – ${formatTime(s.closingTime)}`}
                        </span>
                      </div>
                    ))}
                    
                    {sortedSchedules.length > 1 && (
                      <button 
                        onClick={() => setScheduleExpanded(!scheduleExpanded)}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
                      >
                        {scheduleExpanded ? 'Ocultar semana' : 'Ver toda la semana'}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", scheduleExpanded ? "rotate-180" : "")} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Menú & Promos (La Estrella) */}
            <div className="space-y-8 pt-8 border-t border-gray-200 dark:border-gray-800">
              <PromotionsSection restaurantId={restaurant.id} restaurantName={restaurant.name} />
              <MenuSection restaurantId={restaurant.id} />
            </div>

            {/* 4. Reseñas (Social Proof) */}
            <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
              <RatingsSection
                restaurantId={restaurant.id}
                canReply={!!user && (user.userId === restaurant.ownerId || user.role === 'ADMIN')}
              />
            </div>

            {/* 5. Galería de Fotos */}
            <ImageGallery restaurantId={restaurant.id} />

          </div>

          {/* Sidebar de Conversión */}
          <div className="space-y-6 lg:sticky lg:top-24 self-start">
            
            {/* Widget Principal */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-orange-900/5 dark:shadow-black/20 overflow-hidden">
              
              {/* Banner Estado */}
              <div className={cn("px-6 py-3.5 flex items-center justify-center gap-2", isOpenNow ? "bg-green-500 text-white" : "bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400")}>
                <span className={cn('h-2 w-2 rounded-full', isOpenNow ? 'bg-white animate-pulse' : 'bg-gray-400')} />
                <span className="font-bold tracking-widest uppercase text-xs">
                  {isOpenNow ? 'Abierto Ahora' : 'Cerrado Ahora'}
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* Reserva */}
                {restaurant.acceptsReservations && (
                  <div>
                    <h2 className="font-display text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">Reservar Mesa</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Para {restaurant.minReservationSize}–{restaurant.maxReservationSize} personas</p>
                    <button
                      onClick={() => setReserveOpen(true)}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95"
                    >
                      <Calendar className="h-5 w-5" /> Reservar Ahora
                    </button>
                  </div>
                )}

                <hr className="border-gray-100 dark:border-gray-700" />

                {/* Info Contacto Rápida */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-50 uppercase tracking-wider">Contacto</h3>
                  
                  {restaurant.phone && (
                    <a href={`tel:${restaurant.phone}`} className="flex items-center gap-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                      <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-orange-500" />
                      </div>
                      {restaurant.phone}
                    </a>
                  )}

                  <div className="flex items-start gap-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <div className="h-8 w-8 rounded-full bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-orange-500" />
                    </div>
                    <span className="mt-1.5">{restaurant.address}, {restaurant.city}</span>
                  </div>

                  {!!restaurant.latitude && !!restaurant.longitude && (
                    <div className="pt-2 pl-11">
                      <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm h-32 relative group">
                        <LocationMap lat={restaurant.latitude} lng={restaurant.longitude} />
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-white text-gray-900 font-semibold px-3 py-1.5 rounded-lg text-xs shadow-lg flex items-center gap-1.5">
                            <Globe className="h-3 w-3" /> Abrir en Maps
                          </span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Ecosistema */}
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
