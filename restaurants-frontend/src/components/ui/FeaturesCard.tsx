'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings, Pencil, X, Loader2, Check, Users, Minus, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUpdateRestaurant } from '@/hooks/useRestaurants';
import { createRestaurantSchema, type CreateRestaurantFormData } from '@/validations/restaurantSchema';
import type { Restaurant } from '@/types/restaurant';
import { cn } from '@/utils/cn';

interface FeaturesCardProps {
  restaurant: Restaurant;
}

export function FeaturesCard({ restaurant }: FeaturesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateRestaurant(restaurant.id);

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<CreateRestaurantFormData>({
    resolver: zodResolver(createRestaurantSchema),
    defaultValues: {
      ...restaurant,
      description: restaurant.description ?? '',
      phone: restaurant.phone ?? '',
      email: restaurant.email ?? '',
      website: restaurant.website ?? '',
      ruc: restaurant.ruc ?? '',
      district: restaurant.district ?? '',
      categoryIds: restaurant.categoryIds ?? [],
      minReservationSize: restaurant.minReservationSize ?? 1,
      maxReservationSize: restaurant.maxReservationSize ?? 20,
      acceptsReservations: restaurant.acceptsReservations ?? true,
      acceptsEvents: restaurant.acceptsEvents ?? false,
      hasParking: restaurant.hasParking ?? false,
      hasWifi: restaurant.hasWifi ?? false,
      hasAirConditioning: restaurant.hasAirConditioning ?? false,
      isAccessible: restaurant.isAccessible ?? false,
    },
  });

  const onSubmit = async (data: CreateRestaurantFormData) => {
    try {
      const cleanData = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        ruc: data.ruc || undefined,
      };
      await updateMutation.mutateAsync(cleanData);
      toast.success('Características actualizadas');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar');
    }
  };

  const featuresList = [
    { field: 'acceptsReservations' as const, label: 'Acepta Reservas' },
    { field: 'acceptsEvents' as const, label: 'Eventos Privados' },
    { field: 'hasParking' as const, label: 'Estacionamiento' },
    { field: 'hasWifi' as const, label: 'Wi-Fi' },
    { field: 'hasAirConditioning' as const, label: 'Aire Acond.' },
    { field: 'isAccessible' as const, label: 'Accesibilidad' },
  ];

  const activeFeatures = featuresList.filter(f => restaurant[f.field]);

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 relative overflow-hidden group transition-colors hover:border-gray-200 dark:hover:border-gray-700 h-full">
        <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
          <Settings className="h-32 w-32" />
        </div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center shrink-0">
              <Settings className="h-5 w-5" />
            </span>
            Características
          </h2>
          <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors" title="Editar características">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative z-10 space-y-6">
          {activeFeatures.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeFeatures.map(({ label }) => (
                <span key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                  <Check className="h-3.5 w-3.5 text-blue-500" /> {label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay características configuradas.</p>
          )}

          <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800 mt-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800">
                <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">Tamaño de Grupo</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  De {restaurant.minReservationSize} a {restaurant.maxReservationSize} personas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-orange-500/20 shadow-2xl shadow-orange-500/10 p-6 sm:p-8 relative w-full max-w-2xl my-auto animate-pop-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                  <Settings className="h-5 w-5" />
                </span>
                Editar Características
              </h2>
              <button onClick={() => setIsEditing(false)} className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-2xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {featuresList.map(({ field, label }) => (
                  <label key={field} className="relative flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-200 dark:border-neutral-700 bg-gray-50/50 dark:bg-neutral-900/50 cursor-pointer hover:border-orange-300 dark:hover:border-orange-500/50 transition-all shadow-sm group overflow-hidden">
                    <input {...register(field)} type="checkbox" className="peer sr-only" />
                    
                    {/* Fake Checkbox */}
                    <div className="h-5 w-5 shrink-0 rounded-md border-2 border-gray-300 dark:border-neutral-600 peer-checked:bg-orange-500 peer-checked:border-orange-500 flex items-center justify-center transition-all z-10">
                      <Check className="h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 scale-50 peer-checked:scale-100 transition-all" strokeWidth={3} />
                    </div>
                    
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors z-10">{label}</span>
                    
                    {/* Active Background overlay */}
                    <div className="absolute inset-0 border-2 border-orange-500 rounded-2xl opacity-0 peer-checked:opacity-100 peer-checked:bg-orange-50 dark:peer-checked:bg-orange-500/10 pointer-events-none transition-all"></div>
                  </label>
                ))}
              </div>

              <div className="space-y-3 border-t border-gray-100 dark:border-neutral-800 pt-5 mt-2">
                <div className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-colors">
                  <div>
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Reserva Mínima</label>
                    <p className="text-[11px] text-gray-500 mt-0.5">Personas requeridas</p>
                    {errors.minReservationSize && <p className="text-[10px] text-red-500 mt-1">{errors.minReservationSize.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm shrink-0">
                    <button type="button" onClick={() => setValue('minReservationSize', Math.max(1, (watch('minReservationSize') || 1) - 1), { shouldValidate: true })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition-colors"><Minus className="h-3.5 w-3.5"/></button>
                    <span className="w-6 text-center font-bold text-gray-900 dark:text-white text-sm">{watch('minReservationSize')}</span>
                    <button type="button" onClick={() => setValue('minReservationSize', Math.min(999, (watch('minReservationSize') || 1) + 1), { shouldValidate: true })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition-colors"><Plus className="h-3.5 w-3.5"/></button>
                  </div>
                </div>

                <div className="group flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-colors">
                  <div>
                    <label className="text-[13px] font-bold text-gray-900 dark:text-white">Reserva Máxima</label>
                    <p className="text-[11px] text-gray-500 mt-0.5">Límite de personas</p>
                    {errors.maxReservationSize && <p className="text-[10px] text-red-500 mt-1">{errors.maxReservationSize.message}</p>}
                  </div>
                  <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-sm shrink-0">
                    <button type="button" onClick={() => setValue('maxReservationSize', Math.max(1, (watch('maxReservationSize') || 1) - 1), { shouldValidate: true })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition-colors"><Minus className="h-3.5 w-3.5"/></button>
                    <span className="w-6 text-center font-bold text-gray-900 dark:text-white text-sm">{watch('maxReservationSize')}</span>
                    <button type="button" onClick={() => setValue('maxReservationSize', Math.min(999, (watch('maxReservationSize') || 1) + 1), { shouldValidate: true })} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-500 transition-colors"><Plus className="h-3.5 w-3.5"/></button>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4 p-2 pl-6 rounded-[2rem] border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-800/30 sticky bottom-2 z-10 backdrop-blur-xl">
                <span className="text-sm text-amber-500 font-bold flex items-center gap-2">
                  <Pencil className="h-4 w-4" /> Editando datos...
                </span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3.5 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-neutral-700 rounded-2xl transition-all shadow-sm bg-transparent">
                    Cancelar
                  </button>
                  <button type="submit" disabled={updateMutation.isPending} className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:dark:bg-neutral-800 disabled:dark:text-neutral-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98]">
                    {updateMutation.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
