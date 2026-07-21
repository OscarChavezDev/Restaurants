'use client';

import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  Loader2, Save, SlidersHorizontal, QrCode, Upload, X, ShieldAlert, 
  CreditCard, Users, FileText, Clock, AlertCircle, Maximize, Minus, Plus 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { reservationConfigService, type ReservationConfig } from '@/services/reservationConfigService';
import { uploadToCloudinary, validateImage } from '@/utils/uploadToCloudinary';
import { cn } from '@/utils/cn';

const inputCls =
  'w-full rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white px-5 py-3.5 text-sm font-medium focus:border-orange-500/50 focus:bg-white dark:focus:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-all placeholder:text-gray-400';
const labelCls = 'block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider';

export default function ReservationConfigPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const qc = useQueryClient();
  const { data: mine } = useMyRestaurants();
  const { data: all } = useRestaurants(0, 100);
  const restaurants = (isAdmin ? all?.content : mine?.content) ?? [];

  const [restaurantId, setRestaurantId] = useState<string>('');
  useEffect(() => {
    if (!restaurantId && restaurants.length) setRestaurantId(restaurants[0].id);
  }, [restaurants, restaurantId]);

  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ['reservation-config', restaurantId],
    queryFn: () => reservationConfigService.get(restaurantId),
    enabled: !!restaurantId,
  });

  const [form, setForm] = useState<ReservationConfig | null>(null);
  useEffect(() => { if (config) setForm(config); }, [config]);

  const save = useMutation({
    mutationFn: () => reservationConfigService.update(restaurantId, form!),
    onSuccess: () => {
      toast.success('Configuración guardada exitosamente');
      qc.invalidateQueries({ queryKey: ['reservation-config', restaurantId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Error al guardar'),
  });

  const dirty = !!form && !!config && JSON.stringify(form) !== JSON.stringify(config);

  const set = <K extends keyof ReservationConfig>(k: K, v: ReservationConfig[K]) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  const adjustNumber = (key: keyof ReservationConfig, delta: number, min: number = 0, max: number = 999) => {
    setForm(f => {
      if (!f) return f;
      const current = Number(f[key]) || 0;
      const next = Math.max(min, Math.min(max, current + delta));
      return { ...f, [key]: next };
    });
  };

  const qrInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQr, setUploadingQr] = useState(false);
  const handleQrUpload = async (file: File) => {
    const err = validateImage(file);
    if (err) { toast.error(err); return; }
    try {
      setUploadingQr(true);
      const { url } = await uploadToCloudinary(file, 'payment-qr');
      set('paymentQrUrl', url);
      toast.success('QR cargado. Recuerda guardar los cambios.');
    } catch (e: any) {
      toast.error(e?.message ?? 'No se pudo subir el QR');
    } finally {
      setUploadingQr(false);
    }
  };

  return (
    <div className="h-full flex flex-col pb-10 max-w-[1400px] mx-auto w-full">
      {/* HEADER FIJO MEJORADO */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-8 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-orange-500/10 rounded-2xl">
                <SlidersHorizontal className="h-7 w-7 text-orange-500" />
              </div>
              Reglas de Reserva
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Controla los tiempos, capacidades y políticas de cobro de tu local.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-gray-50/50 dark:bg-neutral-800/30 p-1.5 rounded-3xl border border-gray-100/50 dark:border-neutral-800/50">
            {dirty && (
              <span className="text-sm font-bold text-amber-500 flex items-center gap-1.5 px-3 animate-pulse">
                <AlertCircle className="h-4 w-4" /> Cambios sin guardar
              </span>
            )}
            <button 
              onClick={() => save.mutate()} 
              disabled={save.isPending || !dirty} 
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:dark:bg-neutral-800 disabled:dark:text-neutral-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none"
            >
              {save.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} 
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      {restaurants.length > 1 && (
        <div className="mb-8">
          <RestaurantPicker
            restaurants={restaurants}
            value={restaurantId}
            onChange={(id) => { if (id) setRestaurantId(id); }}
            label="Restaurante a configurar"
          />
        </div>
      )}

      {restaurants.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <p className="text-gray-500 dark:text-gray-400 font-medium">Aún no tienes restaurantes registrados.</p>
        </div>
      ) : loadingConfig || !form ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
          <div className="lg:col-span-5 h-[500px] bg-gray-100 dark:bg-neutral-900 rounded-[2rem]" />
          <div className="lg:col-span-7 h-[500px] bg-gray-100 dark:bg-neutral-900 rounded-[2rem]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* COLUMNA IZQUIERDA: REGLAS GENERALES Y CAPACIDAD */}
          <div className="xl:col-span-5 space-y-8">
            
            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Tiempos</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Control de horas y anticipación.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                  <div>
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Anticipación mínima</label>
                    <p className="text-xs text-gray-500 mt-1">Antes de la reserva</p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner w-full">
                    <button onClick={() => adjustNumber('minAdvanceHours', -1, 0)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Minus className="h-4 w-4"/></button>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{form.minAdvanceHours}h</span>
                    <button onClick={() => adjustNumber('minAdvanceHours', 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Plus className="h-4 w-4"/></button>
                  </div>
                </div>

                <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                  <div>
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Límite cancelación</label>
                    <p className="text-xs text-gray-500 mt-1">Sin penalización</p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner w-full">
                    <button onClick={() => adjustNumber('cancellationDeadlineHours', -1, 0)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Minus className="h-4 w-4"/></button>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{form.cancellationDeadlineHours}h</span>
                    <button onClick={() => adjustNumber('cancellationDeadlineHours', 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Plus className="h-4 w-4"/></button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <Maximize className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Capacidad</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Gestión de mesas y grupos.</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                  <div>
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Capacidad base</label>
                    <p className="text-xs text-gray-500 mt-1">Por mesa (promedio)</p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner w-full">
                    <button onClick={() => adjustNumber('personsPerTable', -1, 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Minus className="h-4 w-4"/></button>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{form.personsPerTable}p</span>
                    <button onClick={() => adjustNumber('personsPerTable', 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Plus className="h-4 w-4"/></button>
                  </div>
                </div>

                <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                  <div>
                    <label className="text-sm font-bold text-gray-900 dark:text-white">Límite Grupo Pequeño</label>
                    <p className="text-xs text-gray-500 mt-1">Aplica regla diferente</p>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner w-full">
                    <button onClick={() => adjustNumber('smallGroupMaxPersons', -1, 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Minus className="h-4 w-4"/></button>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{form.smallGroupMaxPersons}p</span>
                    <button onClick={() => adjustNumber('smallGroupMaxPersons', 1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Plus className="h-4 w-4"/></button>
                  </div>
                </div>
              </div>

              <hr className="my-8 border-gray-100 dark:border-neutral-800" />
              
              <label className="flex items-center gap-4 cursor-pointer p-5 rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-neutral-800/30 hover:border-orange-500/20 hover:bg-orange-50 dark:hover:bg-orange-500/5 transition-all group">
                <div className="relative flex items-center justify-center">
                  <input type="checkbox" checked={form.allowSectionSelection} onChange={(e) => set('allowSectionSelection', e.target.checked)} className="peer sr-only" />
                  <div className="h-7 w-12 rounded-full bg-gray-200 dark:bg-neutral-700 peer-checked:bg-orange-500 transition-colors shadow-inner"></div>
                  <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Permitir elegir sección</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">El cliente podrá escoger ambientes específicos de tu local.</p>
                </div>
              </label>
            </div>
          </div>

          {/* COLUMNA DERECHA: ADELANTOS Y T&C */}
          <div className="xl:col-span-7 space-y-8">
            
            <div className={cn(
              "rounded-[2rem] border transition-all duration-500 overflow-hidden",
              form.requiresAdvancePayment 
                ? "bg-white dark:bg-neutral-900 border-emerald-200 dark:border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.06)]" 
                : "bg-white dark:bg-neutral-900 border-gray-100 dark:border-neutral-800 shadow-sm"
            )}>
              {/* Header Pagos */}
              <div className={cn(
                "p-8 border-b transition-colors duration-500 flex flex-col sm:flex-row sm:items-center justify-between gap-6",
                form.requiresAdvancePayment ? "border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5" : "border-gray-100 dark:border-neutral-800"
              )}>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "p-3 rounded-2xl transition-colors duration-500",
                    form.requiresAdvancePayment ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-neutral-800 text-gray-500"
                  )}>
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Cobro por Adelantado</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reduce el número de inasistencias.</p>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer shrink-0">
                  <span className={cn("text-sm font-bold transition-colors duration-500", form.requiresAdvancePayment ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500")}>
                    {form.requiresAdvancePayment ? 'Activado' : 'Desactivado'}
                  </span>
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={form.requiresAdvancePayment} onChange={(e) => set('requiresAdvancePayment', e.target.checked)} className="peer sr-only" />
                    <div className="h-7 w-12 rounded-full bg-gray-200 dark:bg-neutral-700 peer-checked:bg-emerald-500 transition-colors shadow-inner"></div>
                    <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></div>
                  </div>
                </label>
              </div>

              {/* Contenido Pagos */}
              <div className={cn(
                "grid transition-all duration-500 ease-in-out",
                form.requiresAdvancePayment ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}>
                <div className="overflow-hidden">
                  <div className="p-8 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Users className="h-4 w-4 text-emerald-500" /> Reglas Grupales
                        </h3>
                        
                        <div className="flex bg-gray-100 dark:bg-neutral-800 p-1 rounded-2xl">
                          <button
                            type="button"
                            onClick={() => set('smallGroupAdvanceType', 'CHEAPEST_DISH')}
                            className={cn(
                              'flex-1 text-xs font-bold px-3 py-2.5 rounded-xl transition-all',
                              form.smallGroupAdvanceType === 'CHEAPEST_DISH' ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            )}
                          >
                            Plato más barato
                          </button>
                          <button
                            type="button"
                            onClick={() => set('smallGroupAdvanceType', 'FIXED_AMOUNT')}
                            className={cn(
                              'flex-1 text-xs font-bold px-3 py-2.5 rounded-xl transition-all',
                              form.smallGroupAdvanceType === 'FIXED_AMOUNT' ? 'bg-white dark:bg-neutral-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            )}
                          >
                            Monto Fijo
                          </button>
                        </div>

                        {form.smallGroupAdvanceType === 'FIXED_AMOUNT' && (
                          <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors animate-in fade-in slide-in-from-top-2">
                            <div>
                              <label className="text-sm font-bold text-gray-900 dark:text-white">Monto Fijo Total</label>
                              <p className="text-xs text-gray-500 mt-1">Por toda la mesa</p>
                            </div>
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner w-full">
                              <button type="button" onClick={() => adjustNumber('smallGroupFixedAmount', -5, 0)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Minus className="h-4 w-4"/></button>
                              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">S/ {Number(form.smallGroupFixedAmount).toFixed(2)}</span>
                              <button type="button" onClick={() => adjustNumber('smallGroupFixedAmount', 5, 0)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Plus className="h-4 w-4"/></button>
                            </div>
                          </div>
                        )}
                        
                        <div className="group flex flex-col gap-4 p-5 rounded-2xl bg-white dark:bg-neutral-800/30 border border-gray-200 dark:border-neutral-700/50 hover:border-gray-300 dark:hover:border-neutral-600 transition-colors">
                          <div>
                            <label className="text-sm font-bold text-gray-900 dark:text-white">Grupos Grandes</label>
                            <p className="text-xs text-gray-500 mt-1">% del pedido total</p>
                          </div>
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-neutral-900 p-1.5 rounded-xl border border-gray-100 dark:border-neutral-800 shadow-inner w-full">
                            <button type="button" onClick={() => adjustNumber('largeGroupAdvancePercent', -5, 0, 100)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Minus className="h-4 w-4"/></button>
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{form.largeGroupAdvancePercent}%</span>
                            <button type="button" onClick={() => adjustNumber('largeGroupAdvancePercent', 5, 0, 100)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-neutral-800 text-gray-500 shadow-sm transition-all"><Plus className="h-4 w-4"/></button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <QrCode className="h-4 w-4 text-emerald-500" /> Método de Pago
                        </h3>
                        
                        <div>
                          <label className={labelCls}>QR Integrado</label>
                          <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleQrUpload(f); e.target.value = ''; }} />
                          {form.paymentQrUrl ? (
                            <div className="flex gap-4 p-4 rounded-2xl border-2 border-emerald-100 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/5 group">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={form.paymentQrUrl} alt="QR de pago" className="h-24 w-24 rounded-xl object-cover bg-white shadow-sm group-hover:scale-105 transition-transform" />
                              <div className="flex flex-col justify-center gap-2 flex-1">
                                <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQr} className="inline-flex justify-center items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors">
                                  {uploadingQr ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Cambiar
                                </button>
                                <button type="button" onClick={() => set('paymentQrUrl', undefined)} className="inline-flex justify-center items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                  <X className="h-3.5 w-3.5" /> Quitar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button 
                              type="button" 
                              onClick={() => qrInputRef.current?.click()} 
                              disabled={uploadingQr} 
                              className="w-full flex flex-col items-center justify-center gap-3 h-32 rounded-2xl border-2 border-dashed border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800/50 hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-500/10 dark:hover:border-emerald-500/50 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                            >
                              {uploadingQr ? (
                                <Loader2 className="h-8 w-8 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-6 w-6 opacity-50" />
                                  <span className="text-sm font-bold">Subir imagen Yape/Plin</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        <div>
                          <label className={labelCls}>Instrucciones Adicionales</label>
                          <textarea 
                            rows={3} 
                            value={form.paymentInfo ?? ''} 
                            onChange={(e) => set('paymentInfo', e.target.value)} 
                            placeholder={"Yape: 962 000 000\nBCP: 123-456789-0-12"} 
                            className={cn(inputCls, 'resize-none font-mono text-xs')} 
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-8 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">Términos y Condiciones</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">El cliente deberá aceptarlos al reservar.</p>
                </div>
              </div>
              <textarea 
                rows={4} 
                value={form.termsAndConditions ?? ''} 
                onChange={(e) => set('termsAndConditions', e.target.value)} 
                placeholder="Ej: La reserva se mantiene con 15 minutos de tolerancia. El adelanto no es reembolsable..." 
                className={cn(inputCls, 'resize-none')} 
              />
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
