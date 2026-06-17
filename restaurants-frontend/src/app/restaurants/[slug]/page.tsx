'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import {
  MapPin, Star, Phone, Mail, Globe, Clock, Users, Wifi, Car,
  Wind, Accessibility, Calendar, ArrowLeft, Loader2, ChevronDown, ChevronUp, UtensilsCrossed
} from 'lucide-react';
import { useRestaurantBySlug } from '@/hooks/useRestaurants';
import { useCreateReservation } from '@/hooks/useReservations';
import { useAuthStore } from '@/store/authStore';
import { createReservationSchema, type CreateReservationFormData } from '@/validations/restaurantSchema';
import { formatRating, formatDistance, DAY_LABELS } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { MenuSection } from '@/features/restaurants/MenuSection';
import { ImageGallery } from '@/features/restaurants/ImageGallery';
import { RatingsSection } from '@/features/restaurants/RatingsSection';

const TODAY = new Date().toISOString().split('T')[0];

export default function RestaurantDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const { data: restaurant, isLoading, error } = useRestaurantBySlug(slug);
  const createReservation = useCreateReservation();
  const [showReservationForm, setShowReservationForm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateReservationFormData>({
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

  const onReserve = async (data: CreateReservationFormData) => {
    if (!restaurant) return;
    try {
      const reservation = await createReservation.mutateAsync({
        ...data,
        restaurantId: restaurant.id,
      });
      toast.success(`¡Reserva creada! Código: ${reservation.confirmationCode}`);
      setShowReservationForm(false);
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
      <div className="relative h-72 bg-gradient-to-br from-orange-100 to-orange-200">
        {restaurant.coverImageUrl ? (
          <Image src={restaurant.coverImageUrl} alt={restaurant.name} fill className="object-cover" />
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
            {restaurant.logoUrl && (
              <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-white shadow-lg flex-shrink-0">
                <Image src={restaurant.logoUrl} alt="" fill className="object-cover" />
              </div>
            )}
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

                {!showReservationForm ? (
                  <button
                    onClick={() => setShowReservationForm(true)}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors"
                  >
                    Reservar mesa
                  </button>
                ) : (
                  <form onSubmit={handleSubmit(onReserve)} className="space-y-3">
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
                      <input {...register('startTime')} type="time" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
                      <button type="submit" disabled={createReservation.isPending} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-colors">
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
