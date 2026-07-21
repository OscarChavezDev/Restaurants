'use client';

import { Tag, Calendar, Plus, Trash2, Loader2, X, AlertCircle, Power, Copy, Sparkles, TicketPercent, CheckCircle2, Pencil, Percent, RotateCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { PromoFlyer } from '@/components/ui/PromoFlyer';
import { SelectMenu } from '@/components/ui/SelectMenu';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import type { Promotion } from '@/types/restaurant';

const PROMO_LABELS: Record<string, string> = {
  PERCENTAGE_DISCOUNT: 'Descuento %',
  FIXED_DISCOUNT: 'Descuento fijo',
  COMBO: 'Combo',
  FREE_ITEM: 'Producto gratis',
  HAPPY_HOUR: 'Happy Hour',
};

function discountText(promoType: string, value?: string | number) {
  if (!value) return null;
  if (promoType === 'PERCENTAGE_DISCOUNT') return `${value}% off`;
  if (promoType === 'FIXED_DISCOUNT') return `${formatCurrency(Number(value))} off`;
  return null;
}

const EMPTY_FORM = {
  id: '', title: '', description: '', promoType: 'PERCENTAGE_DISCOUNT',
  discountValue: '', promoCode: '', validFrom: '', validUntil: '',
};

const inputCls = "w-full rounded-2xl border-2 border-transparent bg-gray-50 dark:bg-neutral-800 text-gray-900 dark:text-white px-5 py-3.5 text-sm font-medium outline-none focus:border-orange-500/50 focus:bg-white dark:focus:bg-neutral-900 focus:ring-4 focus:ring-orange-500/10 hover:bg-gray-100 dark:hover:bg-neutral-700/50 transition-all placeholder:text-gray-400";
const labelCls = 'block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider';
const sectionCls = "bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 p-6 sm:p-8 shadow-sm";

export default function PromotionsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurants = (isAdmin ? allRestaurants?.content : myRestaurants?.content) ?? [];
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  useEffect(() => {
    if (!selectedRestaurantId && restaurants.length) setSelectedRestaurantId(restaurants[0].id);
  }, [restaurants, selectedRestaurantId]);

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', selectedRestaurantId],
    queryFn: () => restaurantService.getPromotions(selectedRestaurantId),
    enabled: !!selectedRestaurantId,
  });

  const savePromo = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        promoType: form.promoType,
        discountValue: form.discountValue || undefined,
        promoCode: form.promoCode || undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
      };
      if (form.id) {
        return restaurantService.updatePromotion(form.id, payload);
      } else {
        return restaurantService.createPromotion(selectedRestaurantId, payload);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', selectedRestaurantId] });
      toast.success(form.id ? 'Promoción actualizada' : 'Promoción creada');
      closeModal();
    },
    onError: () => toast.error('Error al guardar la promoción. Revisa los campos obligatorios.'),
  });

  const deletePromo = useMutation({
    mutationFn: (id: string) => restaurantService.deletePromotion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', selectedRestaurantId] });
      toast.success('Promoción eliminada');
    },
    onError: () => toast.error('Error al eliminar la promoción'),
  });

  const togglePromo = useMutation({
    mutationFn: (id: string) => restaurantService.togglePromotion(id),
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['promotions', selectedRestaurantId] });
      toast.success(p?.isActive ? 'Promoción activada' : 'Promoción desactivada');
    },
    onError: () => toast.error('No se pudo cambiar el estado'),
  });

  const genFlyer = useMutation({
    mutationFn: (id: string) => restaurantService.generatePromotionFlyer(id),
    onMutate: () => {
      toast('Generando flyer con IA... puede tardar hasta 2 minutos.');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', selectedRestaurantId] });
      toast.success('Flyer generado con IA.');
    },
    onError: () => toast.error('No se pudo generar el flyer'),
  });

  const selectedRestaurant = restaurants.find((r) => r.id === selectedRestaurantId);

  const editPromo = (p: Promotion) => {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description ?? '',
      promoType: p.promoType,
      discountValue: p.discountValue != null ? String(p.discountValue) : '',
      promoCode: p.promoCode ?? '',
      validFrom: p.validFrom ? p.validFrom.substring(0, 16) : '',
      validUntil: p.validUntil ? p.validUntil.substring(0, 16) : '',
    });
    setShowForm(true);
  };

  const duplicatePromo = (p: Promotion) => {
    setForm({
      id: '',
      title: p.title + ' (Copia)',
      description: p.description ?? '',
      promoType: p.promoType,
      discountValue: p.discountValue != null ? String(p.discountValue) : '',
      promoCode: p.promoCode ?? '',
      validFrom: '',
      validUntil: '',
    });
    setShowForm(true);
    toast('Datos duplicados: ajusta las fechas y guarda');
  };

  const closeModal = () => {
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const dateError = form.validFrom && form.validUntil && form.validFrom >= form.validUntil
    ? 'La fecha de fin debe ser posterior a la de inicio'
    : '';
  const canSubmit = form.title.trim() && form.validFrom && form.validUntil && !dateError && !savePromo.isPending;

  return (
    <div className="h-full flex flex-col pb-10 max-w-[1400px] mx-auto w-full">
      {/* HEADER FIJO MEJORADO - z-40 para evitar superposiciones con tarjetas */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#1C1C1C]/80 backdrop-blur-xl border-b border-gray-100 dark:border-neutral-800 pb-4 mb-8 pt-4 -mx-4 px-4 sm:-mx-8 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="p-2.5 bg-orange-500/10 rounded-2xl">
                <TicketPercent className="h-7 w-7 text-orange-500" />
              </div>
              Promociones
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              Atrae más clientes con descuentos y ofertas especiales.
            </p>
          </div>
          {selectedRestaurantId && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-2xl text-sm shadow-xl bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Nueva Promoción
            </button>
          )}
        </div>
      </div>

      {restaurants.length > 1 && (
        <div className="mb-8">
          <RestaurantPicker
            restaurants={restaurants}
            value={selectedRestaurantId}
            onChange={(id) => { setSelectedRestaurantId(id); setShowForm(false); }}
            label="Restaurante a configurar"
          />
        </div>
      )}

      {/* MODAL DEL FORMULARIO */}
      {showForm && selectedRestaurantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-neutral-800 my-auto flex flex-col max-h-[95vh]">
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 sm:px-8 border-b border-gray-100 dark:border-neutral-800 shrink-0 bg-gray-50/50 dark:bg-neutral-900/50 rounded-t-[2.5rem]">
              <h3 className="font-extrabold text-2xl text-gray-900 dark:text-white flex items-center gap-3">
                {form.id ? (
                  <div className="p-2 bg-orange-500/10 rounded-xl"><Pencil className="h-6 w-6 text-orange-500" /></div>
                ) : (
                  <div className="p-2 bg-orange-500/10 rounded-xl"><Plus className="h-6 w-6 text-orange-500" /></div>
                )}
                {form.id ? 'Editar Oferta' : 'Crear Nueva Oferta'}
              </h3>
              <button onClick={closeModal} className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-xl transition-all">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Cuerpo (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-gray-50/30 dark:bg-black/20">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Formulario Izquierda */}
                <div className="lg:col-span-7 flex flex-col gap-6">

                  {/* Sección: Detalles */}
                  <div className={sectionCls}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-2xl">
                        <Tag className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Detalles de la oferta</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Nombre y descripción visibles para el cliente.</p>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div>
                        <label className={labelCls}>Título *</label>
                        <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej. 2x1 en Hamburguesas" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Descripción (opcional)</label>
                        <textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej. Disfruta de 2 hamburguesas clásicas por el precio de 1..." className={cn(inputCls, 'resize-none')} />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Descuento */}
                  <div className={sectionCls}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl">
                        <Percent className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Descuento</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Modalidad, valor y código de canje.</p>
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className={labelCls}>Tipo de promoción</label>
                          <SelectMenu
                            value={form.promoType}
                            onChange={(v) => setForm({ ...form, promoType: v })}
                            className="w-full"
                            options={Object.entries(PROMO_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                          />
                        </div>
                        <div>
                          <label className={labelCls}>Valor del descuento</label>
                          <div className="relative">
                            <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                              placeholder={form.promoType === 'PERCENTAGE_DISCOUNT' ? '20' : '15'} type="number" step="0.01"
                              disabled={form.promoType === 'COMBO' || form.promoType === 'FREE_ITEM'}
                              className={cn(inputCls, 'pr-12 disabled:opacity-50 disabled:cursor-not-allowed')} />
                            <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 dark:text-gray-500">
                              {form.promoType === 'PERCENTAGE_DISCOUNT' ? '%' : 'S/'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Código promocional (opcional)</label>
                        <input value={form.promoCode} onChange={e => setForm({ ...form, promoCode: e.target.value.toUpperCase() })} placeholder="Ej. VERANO2026" className={cn(inputCls, 'font-mono text-orange-600 dark:text-orange-400 font-extrabold uppercase')} />
                      </div>
                    </div>
                  </div>

                  {/* Sección: Vigencia */}
                  <div className={sectionCls}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">Vigencia</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Periodo en que la oferta estará disponible.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}>Válida desde *</label>
                        <DateTimePicker value={form.validFrom} onChange={(v) => setForm({ ...form, validFrom: v })} error={!!dateError} />
                      </div>
                      <div>
                        <label className={labelCls}>Válida hasta *</label>
                        <DateTimePicker value={form.validUntil} onChange={(v) => setForm({ ...form, validUntil: v })} error={!!dateError}
                          minDate={form.validFrom ? new Date(form.validFrom) : undefined} />
                      </div>
                    </div>
                    {dateError && (
                      <div className="flex items-center gap-3 text-sm text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20 mt-5">
                        <AlertCircle className="h-5 w-5 shrink-0" /> <p>{dateError}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vista Previa Derecha — sticky: queda visible mientras se llena el formulario más largo */}
                <div className="lg:col-span-5 self-start lg:sticky lg:top-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4" /> Vista Previa
                  </p>

                  <div className="bg-gray-50/50 dark:bg-neutral-800/30 rounded-3xl p-6 border border-dashed border-gray-200 dark:border-neutral-700/50">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-gray-100 dark:border-neutral-700 shadow-xl shadow-gray-200/50 dark:shadow-none p-5 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -z-0" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">
                            <Tag className="h-3.5 w-3.5" /> {PROMO_LABELS[form.promoType]}
                          </span>
                        </div>
                        
                        <h4 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight">{form.title || 'Título de la promoción'}</h4>
                        {form.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{form.description}</p>}
                        
                        {discountText(form.promoType, form.discountValue) && (
                          <p className="text-2xl font-black text-orange-500 mt-4">
                            {form.promoType === 'PERCENTAGE_DISCOUNT' ? `${form.discountValue}%` : formatCurrency(Number(form.discountValue))} <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">OFF</span>
                          </p>
                        )}

                        {form.promoCode && (
                          <div className="mt-4 inline-block bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1.5 rounded-lg">
                            <p className="text-[10px] font-bold text-orange-600/70 dark:text-orange-400/70 uppercase mb-0.5">Código Promo</p>
                            <code className="text-sm font-black font-mono text-orange-600 dark:text-orange-400 tracking-wider">{form.promoCode}</code>
                          </div>
                        )}
                        
                        {form.validUntil && (
                          <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                            <Calendar className="h-4 w-4" /> Válido hasta el {new Date(form.validUntil).toLocaleDateString('es-PE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-6 sm:px-8 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 flex justify-end gap-3 shrink-0 rounded-b-[2rem]">
              <button onClick={closeModal} className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-800 transition-colors">
                Cancelar
              </button>
              <button onClick={() => savePromo.mutate()} disabled={!canSubmit}
                className="inline-flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:dark:bg-neutral-800 disabled:dark:text-neutral-500 text-white font-bold rounded-2xl text-sm shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] disabled:active:scale-100 disabled:shadow-none">
                {savePromo.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} 
                {form.id ? 'Guardar Cambios' : 'Crear Promoción'}
              </button>
            </div>
          </div>
        </div>
      )}

      {restaurants.length === 0 ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <TicketPercent className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-neutral-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Aún no tienes un restaurante registrado.</p>
        </div>
      ) : !selectedRestaurantId ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <TicketPercent className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-neutral-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Selecciona un restaurante para gestionar sus ofertas.</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-100 dark:bg-neutral-900 rounded-[2rem]" />)}
        </div>
      ) : !promotions?.length ? (
        <div className="text-center py-24 bg-white dark:bg-neutral-900 rounded-[2rem] border border-dashed border-gray-200 dark:border-neutral-800">
          <TicketPercent className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-neutral-700" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No hay promociones activas. ¡Crea la primera!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {promotions.map((promo: Promotion) => (
            <div key={promo.id} className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
              <div className="p-5 flex-1 relative">
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-orange-500/5 to-transparent rounded-bl-full -z-0" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400">
                      {PROMO_LABELS[promo.promoType]}
                    </span>
                    <span className={cn(
                      "text-xs font-bold px-3 py-1 rounded-full flex shrink-0 items-center gap-1.5",
                      promo.isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-neutral-800 text-gray-500'
                    )}>
                      {promo.isActive ? <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />}
                      {promo.isActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mb-1.5 leading-tight line-clamp-2">{promo.title}</h3>
                  {promo.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">{promo.description}</p>}

                  {(promo.discountValue || promo.promoCode) && (
                    <div className="flex items-end justify-between gap-3 mb-3">
                      {promo.discountValue ? (
                        <p className="text-xl font-black text-orange-500 leading-none">
                          {promo.promoType === 'PERCENTAGE_DISCOUNT' ? `${promo.discountValue}%` : formatCurrency(Number(promo.discountValue))}{' '}
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">OFF</span>
                        </p>
                      ) : <span />}

                      {promo.promoCode && (
                        <div className="shrink-0 bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 px-3 py-1.5 rounded-lg">
                          <code className="text-xs font-black font-mono text-orange-600 dark:text-orange-400 tracking-wider">{promo.promoCode}</code>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    Hasta {new Date(promo.validUntil).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>

                  {/* Vista previa del flyer */}
                  {promo.flyerHeadline && (
                    <div className="mt-4 bg-purple-50/50 dark:bg-purple-500/5 p-3.5 rounded-2xl border border-purple-100/50 dark:border-purple-500/10">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600/70 dark:text-purple-400/70 mb-3 flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" /> Generado por IA
                      </p>
                      <PromoFlyer promo={{ ...promo, restaurantName: selectedRestaurant?.name }} className="max-w-[130px] mx-auto" />
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/50 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => togglePromo.mutate(promo.id)}
                  disabled={togglePromo.isPending}
                  className={cn(
                    'flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 border',
                    promo.isActive
                      ? 'bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700'
                      : 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600'
                  )}
                >
                  <Power className="h-4 w-4" /> {promo.isActive ? 'Pausar' : 'Activar'}
                </button>
                
                <button
                  onClick={() => editPromo(promo)}
                  className="flex-1 inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all active:scale-[0.98]"
                >
                  <Pencil className="h-4 w-4 text-gray-400" /> Editar
                </button>

                <button
                  onClick={() => duplicatePromo(promo)}
                  className="flex-none inline-flex justify-center items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all active:scale-[0.98]"
                  title="Duplicar"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>

                {(() => {
                  const generating = genFlyer.isPending && genFlyer.variables === promo.id;
                  return (
                    <button
                      onClick={() => genFlyer.mutate(promo.id)}
                      disabled={genFlyer.isPending}
                      className="w-full mt-2 inline-flex justify-center items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Generando... (hasta 2 min)
                        </>
                      ) : promo.flyerHeadline ? (
                        <>
                          <RotateCw className="h-4 w-4" /> Regenerar Flyer con IA
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" /> Crear Flyer con IA
                        </>
                      )}
                    </button>
                  );
                })()}

                <button onClick={() => deletePromo.mutate(promo.id)} disabled={deletePromo.isPending}
                  title="Eliminar promoción" className="p-2.5 ml-auto text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors border border-transparent">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
