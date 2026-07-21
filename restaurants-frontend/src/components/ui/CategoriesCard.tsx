'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Tag, Pencil, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUpdateRestaurant } from '@/hooks/useRestaurants';
import { createRestaurantSchema, type CreateRestaurantFormData } from '@/validations/restaurantSchema';
import type { Restaurant } from '@/types/restaurant';
import { CategoryPicker } from '@/components/ui/CategoryPicker';

interface CategoriesCardProps {
  restaurant: Restaurant;
}

export function CategoriesCard({ restaurant }: CategoriesCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateRestaurant(restaurant.id);

  const { handleSubmit, setValue, watch } = useForm<CreateRestaurantFormData>({
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
      toast.success('Categorías actualizadas');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 relative overflow-hidden group transition-colors hover:border-gray-200 dark:hover:border-gray-700 h-full">
        <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
          <Tag className="h-32 w-32" />
        </div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
              <Tag className="h-5 w-5" />
            </span>
            Categorías
          </h2>
          <button onClick={() => setIsEditing(true)} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors" title="Editar categorías">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative z-10">
          {restaurant.categories && restaurant.categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {restaurant.categories.map(c => (
                <span key={c} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 text-sm rounded-xl font-medium border border-gray-100 dark:border-gray-700 shadow-sm">
                  {c}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">No hay categorías configuradas.</p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-orange-500/20 shadow-2xl shadow-orange-500/10 p-6 sm:p-8 relative w-full max-w-2xl my-auto animate-pop-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                  <Pencil className="h-5 w-5" />
                </span>
                Editar Categorías
              </h2>
              <button onClick={() => setIsEditing(false)} className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-2xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="bg-gray-50/50 dark:bg-neutral-900/30 p-6 sm:p-8 rounded-[2rem] border border-gray-100 dark:border-neutral-800">
                 <CategoryPicker value={watch('categoryIds') ?? []} onChange={(ids) => setValue('categoryIds', ids)} />
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
