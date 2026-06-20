'use client';

import { Tag, Calendar, Plus, Trash2, Loader2, X, AlertCircle, Power, Copy } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import { SelectMenu } from '@/components/ui/SelectMenu';
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

// Texto del valor del descuento según el tipo.
function discountText(promoType: string, value?: string | number) {
  if (!value) return null;
  if (promoType === 'PERCENTAGE_DISCOUNT') return `${value}% off`;
  if (promoType === 'FIXED_DISCOUNT') return `${formatCurrency(Number(value))} off`;
  return null;
}

const EMPTY_FORM = {
  title: '', description: '', promoType: 'PERCENTAGE_DISCOUNT',
  discountValue: '', promoCode: '', validFrom: '', validUntil: '',
};

export default function PromotionsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurants = isAdmin ? allRestaurants : myRestaurants;
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const qc = useQueryClient();

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', selectedRestaurantId],
    queryFn: () => restaurantService.getPromotions(selectedRestaurantId),
    enabled: !!selectedRestaurantId,
  });

  const createPromo = useMutation({
    mutationFn: () => restaurantService.createPromotion(selectedRestaurantId, {
      title: form.title,
      description: form.description || undefined,
      promoType: form.promoType,
      discountValue: form.discountValue || undefined,
      promoCode: form.promoCode || undefined,
      validFrom: form.validFrom || undefined,
      validUntil: form.validUntil || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['promotions', selectedRestaurantId] });
      toast.success('Promoción creada');
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
    onError: () => toast.error('Error al crear la promoción. Revisa los campos obligatorios.'),
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

  // Reutilizar: precarga el formulario con los datos de una promoción (sin las fechas).
  const reusePromo = (p: Promotion) => {
    setForm({
      title: p.title,
      description: p.description ?? '',
      promoType: p.promoType,
      discountValue: p.discountValue != null ? String(p.discountValue) : '',
      promoCode: p.promoCode ?? '',
      validFrom: '',
      validUntil: '',
    });
    setShowForm(true);
    toast('Datos cargados: ajusta las fechas y crea la nueva promoción');
  };

  // Validación de fechas: fin posterior al inicio.
  const dateError = form.validFrom && form.validUntil && form.validFrom >= form.validUntil
    ? 'La fecha de fin debe ser posterior a la de inicio'
    : '';
  const canSubmit = form.title.trim() && form.validFrom && form.validUntil && !dateError && !createPromo.isPending;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Promociones</h1>
        <p className="text-gray-600 mt-1">Crea y gestiona descuentos y ofertas por restaurante</p>
      </div>

      <RestaurantPicker
        restaurants={restaurants?.content ?? []}
        value={selectedRestaurantId}
        onChange={(id) => { setSelectedRestaurantId(id); setShowForm(false); }}
        label="Selecciona un restaurante para gestionar sus promociones"
      />

      {selectedRestaurantId && (
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cerrar' : 'Nueva promoción'}
        </button>
      )}

      {showForm && selectedRestaurantId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Formulario */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Crear promoción</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título *"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <SelectMenu
                value={form.promoType}
                onChange={(v) => setForm({ ...form, promoType: v })}
                className="w-full"
                options={Object.entries(PROMO_LABELS).map(([k, v]) => ({ value: k, label: v }))}
              />
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:col-span-2" />
              <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.promoType === 'PERCENTAGE_DISCOUNT' ? 'Porcentaje (ej. 20)' : 'Monto en S/. (ej. 10)'} type="number" step="0.01"
                disabled={form.promoType === 'COMBO' || form.promoType === 'FREE_ITEM'}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100 disabled:text-gray-400" />
              <input value={form.promoCode} onChange={e => setForm({ ...form, promoCode: e.target.value.toUpperCase() })} placeholder="Código (opcional)"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500" />
              <label className="text-xs text-gray-500 flex flex-col gap-1">
                Válida desde *
                <input value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} type="datetime-local"
                  className={cn('border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2', dateError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-orange-500')} />
              </label>
              <label className="text-xs text-gray-500 flex flex-col gap-1">
                Válida hasta *
                <input value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} type="datetime-local"
                  className={cn('border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2', dateError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200 focus:ring-orange-500')} />
              </label>
            </div>
            {dateError && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-500 font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> {dateError}
              </p>
            )}
            <button onClick={() => createPromo.mutate()} disabled={!canSubmit}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all active:scale-95">
              {createPromo.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear promoción
            </button>
          </div>

          {/* Preview en vivo */}
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Vista previa</p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  <Tag className="h-3 w-3" /> {PROMO_LABELS[form.promoType]}
                </span>
                {discountText(form.promoType, form.discountValue) && (
                  <span className="text-sm font-bold text-orange-600">{discountText(form.promoType, form.discountValue)}</span>
                )}
              </div>
              <h4 className="font-semibold text-gray-900">{form.title || 'Título de la promoción'}</h4>
              {form.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.description}</p>}
              {form.promoCode && (
                <code className="mt-3 inline-block text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700">{form.promoCode}</code>
              )}
              {form.validUntil && (
                <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="h-3 w-3" /> Hasta {new Date(form.validUntil).toLocaleDateString('es-PE')}
                </div>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-3">Así se verá tu promoción en el panel y en la ficha pública.</p>
          </div>
        </div>
      )}

      {!selectedRestaurantId ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>Selecciona un restaurante para ver y crear sus promociones</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1, 2, 3].map(i => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      ) : !promotions?.length ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>Sin promociones aún. Crea una con el botón de arriba.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo: Promotion) => (
            <div key={promo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {PROMO_LABELS[promo.promoType]}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {promo.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                  <button onClick={() => deletePromo.mutate(promo.id)} disabled={deletePromo.isPending}
                    title="Eliminar promoción" className="p-1 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{promo.title}</h3>
              {promo.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{promo.description}</p>}
              {promo.discountValue && (
                <p className="text-lg font-bold text-orange-600">
                  {promo.promoType === 'PERCENTAGE_DISCOUNT' ? `${promo.discountValue}%` : formatCurrency(promo.discountValue)} off
                </p>
              )}
              {promo.promoCode && (
                <div className="mt-3 flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{promo.promoCode}</code>
                </div>
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="h-3 w-3" />
                Hasta {new Date(promo.validUntil).toLocaleDateString('es-PE')}
              </div>

              {/* Acciones */}
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-2">
                <button
                  onClick={() => togglePromo.mutate(promo.id)}
                  disabled={togglePromo.isPending}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 disabled:opacity-50',
                    promo.isActive
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  )}
                >
                  <Power className="h-3.5 w-3.5" /> {promo.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => reusePromo(promo)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-50 text-orange-600 hover:bg-orange-100 transition-all active:scale-95"
                >
                  <Copy className="h-3.5 w-3.5" /> Reutilizar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
