'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Phone, Mail, Users, Star, Pencil, X, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import { useUpdateRestaurant } from '@/hooks/useRestaurants';
import { createRestaurantSchema, type CreateRestaurantFormData } from '@/validations/restaurantSchema';
import type { Restaurant } from '@/types/restaurant';
import { cn } from '@/utils/cn';

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), {
  ssr: false,
  loading: () => <div className="h-[200px] rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />,
});

// @ts-ignore
import ubigeo from 'ubigeo-peru';

const departments = ubigeo.reniec.filter((u: any) => u.provincia === '00' && u.distrito === '00');

interface BasicInfoCardProps {
  restaurant: Restaurant;
}

export function BasicInfoCard({ restaurant }: BasicInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const updateMutation = useUpdateRestaurant(restaurant.id);

  // Ubigeo state
  const [rDepId, setRDepId] = useState<string>('');
  const [rProvId, setRProvId] = useState<string>('');
  const [rDistId, setRDistId] = useState<string>('');
  const [locationErr, setLocationErr] = useState('');

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<CreateRestaurantFormData>({
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

  // Initialize ubigeo on edit open
  const startEditing = () => {
    const dep = departments.find((d: any) => d.nombre === restaurant.region);
    const depId = dep ? dep.departamento : '';
    setRDepId(depId);
    
    let provId = '';
    if (depId) {
      const provs = ubigeo.reniec.filter((u: any) => u.departamento === depId && u.provincia !== '00' && u.distrito === '00');
      const prov = provs.find((p: any) => p.nombre === restaurant.city);
      provId = prov ? prov.provincia : '';
      setRProvId(provId);
    }
    
    if (depId && provId && restaurant.district) {
      const dists = ubigeo.reniec.filter((u: any) => u.departamento === depId && u.provincia === provId && u.distrito !== '00');
      const dist = dists.find((d: any) => d.nombre === restaurant.district);
      setRDistId(dist ? dist.distrito : '');
    } else {
      setRDistId('');
    }
    
    setLocationErr('');
    reset();
    setIsEditing(true);
  };

  const provinces = rDepId ? ubigeo.reniec.filter((u: any) => u.departamento === rDepId && u.provincia !== '00' && u.distrito === '00') : [];
  const districts = (rDepId && rProvId) ? ubigeo.reniec.filter((u: any) => u.departamento === rDepId && u.provincia === rProvId && u.distrito !== '00') : [];

  const onSubmit = async (data: CreateRestaurantFormData) => {
    if (!rDepId || !rProvId) {
      setLocationErr('Región y Ciudad son obligatorias');
      return;
    }
    
    const depName = departments.find((d: any) => d.departamento === rDepId)?.nombre || '';
    const provName = provinces.find((p: any) => p.provincia === rProvId)?.nombre || '';
    const distName = districts.find((d: any) => d.distrito === rDistId)?.nombre || '';

    try {
      const cleanData = {
        ...data,
        email: data.email || undefined,
        phone: data.phone || undefined,
        website: data.website || undefined,
        ruc: data.ruc || undefined,
        region: depName,
        city: provName,
        district: distName || undefined,
      };
      await updateMutation.mutateAsync(cleanData);
      toast.success('Datos actualizados');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Error al guardar');
    }
  };

  const inputCls = 'w-full bg-white dark:bg-neutral-900/50 border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white rounded-2xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm';
  const labelCls = 'block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 ml-1';
  const groupCls = 'p-6 sm:p-8 bg-gray-50/50 dark:bg-neutral-900/30 border border-gray-100 dark:border-neutral-800 rounded-[2rem] space-y-5';
  const groupTitleCls = 'text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-neutral-800/60';

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 relative overflow-hidden group transition-colors hover:border-gray-200 dark:hover:border-gray-700 h-full">
        <div className="absolute -top-6 -right-6 p-6 opacity-[0.03] dark:opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
          <MapPin className="h-32 w-32" />
        </div>
        
        <div className="flex items-center justify-between mb-6 relative z-10">
          <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5" />
            </span>
            Datos del Local
          </h2>
          <button onClick={startEditing} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-colors" title="Editar datos">
            <Pencil className="h-4 w-4" />
          </button>
        </div>
        
        <div className="space-y-5 relative z-10">
          <div className="flex gap-4">
            <div className="w-8 flex justify-center pt-1"><MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{restaurant.address}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{restaurant.district ? `${restaurant.district}, ` : ''}{restaurant.city}, {restaurant.region}</p>
            </div>
          </div>
          
          {restaurant.phone && (
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center"><Phone className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{restaurant.phone}</p>
            </div>
          )}
          
          {restaurant.email && (
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center"><Mail className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{restaurant.email}</p>
            </div>
          )}

          {restaurant.website && (
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center"><Star className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
              <a href={restaurant.website} target="_blank" rel="noreferrer" className="text-sm font-medium text-orange-500 hover:underline">{restaurant.website.replace(/^https?:\/\//, '')}</a>
            </div>
          )}

          {restaurant.ruc && (
            <div className="flex items-center gap-4">
              <div className="w-8 flex justify-center"><div className="h-5 w-5 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">RUC</div></div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{restaurant.ruc}</p>
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center"><Users className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Capacidad: <strong className="text-gray-900 dark:text-white">{restaurant.totalCapacity}</strong> personas</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-8 flex justify-center"><Star className="h-5 w-5 text-yellow-400" /></div>
            <p className="text-sm text-gray-600 dark:text-gray-400"><strong className="text-gray-900 dark:text-white">{restaurant.avgRating?.toFixed(1) || '0.0'}</strong> ({restaurant.totalRatings || 0} reseñas)</p>
          </div>

          {restaurant.description && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{restaurant.description}</p>
            </div>
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
                Editar Datos
              </h2>
              <button onClick={() => setIsEditing(false)} className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-2xl bg-gray-50 dark:bg-neutral-800 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              {/* GRUPO: PRINCIPAL */}
              <div className={groupCls}>
                <h3 className={groupTitleCls}>
                  <Star className="h-4 w-4 text-orange-500" /> Información Principal
                </h3>
                <div>
                  <label className={labelCls}>Nombre del Restaurante</label>
                  <input {...register('name')} className={inputCls} placeholder="Ej. El Buen Sabor" />
                  {errors.name && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className={labelCls}>Descripción Corta</label>
                  <textarea {...register('description')} rows={3} className={cn(inputCls, 'resize-none')} placeholder="Describe tu restaurante..." />
                  {errors.description && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.description.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>RUC (Opcional)</label>
                    <input {...register('ruc')} maxLength={11} className={inputCls} placeholder="11 dígitos" />
                    {errors.ruc && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.ruc.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Aforo Total</label>
                    <input type="number" {...register('totalCapacity', { valueAsNumber: true })} className={inputCls} placeholder="Personas" />
                    {errors.totalCapacity && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.totalCapacity.message}</p>}
                  </div>
                </div>
              </div>

              {/* GRUPO: CONTACTO */}
              <div className={groupCls}>
                <h3 className={groupTitleCls}>
                  <Phone className="h-4 w-4 text-orange-500" /> Contacto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Teléfono</label>
                    <input {...register('phone')} className={inputCls} placeholder="+51 ..." />
                    {errors.phone && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Correo Electrónico</label>
                    <input {...register('email')} className={inputCls} placeholder="correo@ejemplo.com" />
                    {errors.email && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.email.message}</p>}
                  </div>
                </div>
                
                <div>
                  <label className={labelCls}>Sitio Web / Redes</label>
                  <input {...register('website')} type="url" placeholder="https://" className={inputCls} />
                  {errors.website && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.website.message}</p>}
                </div>
              </div>

              {/* GRUPO: UBICACION */}
              <div className={groupCls}>
                <h3 className={groupTitleCls}>
                  <MapPin className="h-4 w-4 text-orange-500" /> Ubicación
                </h3>
                <div>
                  <label className={labelCls}>Dirección Exacta</label>
                  <input {...register('address')} className={inputCls} placeholder="Av. Principal 123" />
                  {errors.address && <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.address.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Región</label>
                    <select value={rDepId} onChange={(e) => { setRDepId(e.target.value); setRProvId(''); setRDistId(''); }} className={inputCls}>
                      <option value="">Seleccione...</option>
                      {departments.map((d: any) => (
                        <option key={d.departamento} value={d.departamento}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Ciudad</label>
                    <select value={rProvId} onChange={(e) => { setRProvId(e.target.value); setRDistId(''); }} className={inputCls} disabled={!rDepId}>
                      <option value="">Seleccione...</option>
                      {provinces.map((p: any) => (
                        <option key={p.provincia} value={p.provincia}>{p.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Distrito</label>
                    <select value={rDistId} onChange={(e) => setRDistId(e.target.value)} className={inputCls} disabled={!rProvId}>
                      <option value="">Seleccione...</option>
                      {districts.map((d: any) => (
                        <option key={d.distrito} value={d.distrito}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>
                </div>
                {locationErr && <p className="text-xs text-red-500 mt-1.5 ml-1">{locationErr}</p>}

                <div className="pt-2">
                  <label className={labelCls}>Ubica el local en el mapa</label>
                  <div className="h-[250px] w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm relative z-0">
                    <LocationPicker
                      lat={watch('latitude')}
                      lng={watch('longitude')}
                      onChange={(la, ln) => {
                        setValue('latitude', la, { shouldValidate: true });
                        setValue('longitude', ln, { shouldValidate: true });
                      }}
                    />
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
