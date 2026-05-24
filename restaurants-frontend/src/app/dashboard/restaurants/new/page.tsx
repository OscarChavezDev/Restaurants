'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useCreateRestaurant } from '@/hooks/useRestaurants';
import { createRestaurantSchema, type CreateRestaurantFormData } from '@/validations/restaurantSchema';

export default function NewRestaurantPage() {
  const router = useRouter();
  const createMutation = useCreateRestaurant();

  const { register, handleSubmit, formState: { errors } } = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      city: 'Tingo María',
      region: 'Huánuco',
      totalCapacity: 30,
      minReservationSize: 1,
      maxReservationSize: 20,
      acceptsReservations: true,
      acceptsEvents: false,
      hasParking: false,
      hasWifi: false,
      hasAirConditioning: false,
      isAccessible: false,
    },
  });

  const onSubmit = async (data: CreateRestaurantFormData) => {
    try {
      const restaurant = await createMutation.mutateAsync(data);
      toast.success('¡Restaurante creado exitosamente!');
      router.push('/dashboard/restaurants');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al crear el restaurante';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/restaurants" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Nuevo Restaurante</h1>
          <p className="text-gray-600 mt-0.5">Completa la información de tu restaurante</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Información básica */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Información básica</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del restaurante *</label>
              <input {...register('name')} placeholder="Ej: La Selva Restaurante" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea {...register('description')} rows={3} placeholder="Describe tu restaurante..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input {...register('phone')} placeholder="+51 962 000 000" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="contacto@restaurante.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
              <input {...register('ruc')} placeholder="20123456789" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.ruc && <p className="text-xs text-red-500 mt-1">{errors.ruc.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio web</label>
              <input {...register('website')} placeholder="https://mirestaurante.com" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </section>

        {/* Ubicación */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Ubicación</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <input {...register('address')} placeholder="Jr. Raymondi 450" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
              <input {...register('district')} placeholder="Ej: Rupa Rupa" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input {...register('city')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Región *</label>
              <input {...register('region')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.region && <p className="text-xs text-red-500 mt-1">{errors.region.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud</label>
              <input {...register('latitude', { valueAsNumber: true })} type="number" step="0.000001" placeholder="-9.2961" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
              <input {...register('longitude', { valueAsNumber: true })} type="number" step="0.000001" placeholder="-75.9973" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
        </section>

        {/* Capacidad */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-display text-base font-semibold text-gray-900 mb-4">Capacidad</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad total *</label>
              <input {...register('totalCapacity', { valueAsNumber: true })} type="number" min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              {errors.totalCapacity && <p className="text-xs text-red-500 mt-1">{errors.totalCapacity.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserva mínima</label>
              <input {...register('minReservationSize', { valueAsNumber: true })} type="number" min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reserva máxima</label>
              <input {...register('maxReservationSize', { valueAsNumber: true })} type="number" min="1" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {createMutation.isPending ? 'Creando...' : 'Crear Restaurante'}
          </button>
          <Link href="/dashboard/restaurants" className="px-8 py-3 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
