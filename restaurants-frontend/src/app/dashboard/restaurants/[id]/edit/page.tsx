'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useRestaurant, useUpdateRestaurant } from '@/hooks/useRestaurants';
import { createRestaurantSchema, type CreateRestaurantFormData } from '@/validations/restaurantSchema';
import type { Restaurant } from '@/types/restaurant';

export default function EditRestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const { data: restaurant, isLoading } = useRestaurant(id);

  if (isLoading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 skeleton rounded-xl w-64" />
        <div className="h-48 skeleton rounded-2xl" />
        <div className="h-48 skeleton rounded-2xl" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Restaurante no encontrado</p>
        <Link href="/dashboard/restaurants" className="text-orange-500 hover:underline mt-2 block">Volver</Link>
      </div>
    );
  }

  return <EditForm id={id} restaurant={restaurant} />;
}

function EditForm({ id, restaurant }: { id: string; restaurant: Restaurant }) {
  const router = useRouter();
  const updateMutation = useUpdateRestaurant(id);

  const { register, handleSubmit, formState: { errors } } = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      name: restaurant.name,
      description: restaurant.description ?? '',
      phone: restaurant.phone ?? '',
      email: restaurant.email ?? '',
      website: restaurant.website ?? '',
      address: restaurant.address,
      district: restaurant.district ?? '',
      city: restaurant.city,
      region: restaurant.region,
      latitude: restaurant.latitude ?? undefined,
      longitude: restaurant.longitude ?? undefined,
      totalCapacity: restaurant.totalCapacity,
      minReservationSize: restaurant.minReservationSize,
      maxReservationSize: restaurant.maxReservationSize,
      acceptsReservations: restaurant.acceptsReservations,
      acceptsEvents: restaurant.acceptsEvents,
      hasParking: restaurant.hasParking,
      hasWifi: restaurant.hasWifi,
      hasAirConditioning: restaurant.hasAirConditioning,
      isAccessible: restaurant.isAccessible,
    },
  });

  const onSubmit = async (data: CreateRestaurantFormData) => {
    try {
      await updateMutation.mutateAsync(data);
      toast.success('¡Cambios guardados!');
      router.push(`/dashboard/restaurants/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al guardar los cambios';
      toast.error(msg);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/restaurants/${id}`} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Editar Restaurante</h1>
          <p className="text-gray-600 mt-0.5">Actualiza la información de {restaurant.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Información básica */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Información básica</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del restaurante *</label>
              <input {...register('name')} className={inputCls} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea {...register('description')} rows={3} className={`${inputCls} resize-none`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input {...register('phone')} placeholder="+51 962 000 000" className={inputCls} />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" className={inputCls} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
              <input {...register('website')} placeholder="https://mirestaurante.com" className={inputCls} />
              {errors.website && <p className="text-xs text-red-500 mt-1">{errors.website.message}</p>}
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Ubicación</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input {...register('address')} className={inputCls} />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
              <input {...register('district')} className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input {...register('city')} className={inputCls} />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región *</label>
              <input {...register('region')} className={inputCls} />
              {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input {...register('latitude', { valueAsNumber: true })} type="number" step="0.000001" className={inputCls} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input {...register('longitude', { valueAsNumber: true })} type="number" step="0.000001" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Capacidad */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Capacidad</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad total *</label>
              <input {...register('totalCapacity', { valueAsNumber: true })} type="number" min="1" className={inputCls} />
              {errors.totalCapacity && <p className="text-xs text-red-500 mt-1">{errors.totalCapacity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserva mínima</label>
              <input {...register('minReservationSize', { valueAsNumber: true })} type="number" min="1" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserva máxima</label>
              <input {...register('maxReservationSize', { valueAsNumber: true })} type="number" min="1" className={inputCls} />
            </div>
          </div>
        </section>

        {/* Características */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Características</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { field: 'acceptsReservations' as const, label: 'Acepta reservas' },
              { field: 'acceptsEvents' as const, label: 'Acepta eventos' },
              { field: 'hasParking' as const, label: 'Estacionamiento' },
              { field: 'hasWifi' as const, label: 'WiFi' },
              { field: 'hasAirConditioning' as const, label: 'Aire acondicionado' },
              { field: 'isAccessible' as const, label: 'Accesible' },
            ].map(({ field, label }) => (
              <label key={field} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-colors">
                <input {...register(field)} type="checkbox" className="h-4 w-4 rounded accent-orange-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Botones */}
        <div className="flex gap-3 pb-8">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {updateMutation.isPending ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href={`/dashboard/restaurants/${id}`} className="px-8 py-3 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
