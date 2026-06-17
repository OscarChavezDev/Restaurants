'use client';

import { Tag, Calendar, Plus, Trash2, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import toast from 'react-hot-toast';
import type { Promotion } from '@/types/restaurant';

const PROMO_LABELS: Record<string, string> = {
  PERCENTAGE_DISCOUNT: 'Descuento %',
  FIXED_DISCOUNT: 'Descuento fijo',
  COMBO: 'Combo',
  FREE_ITEM: 'Producto gratis',
  HAPPY_HOUR: 'Happy Hour',
};

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

  const canSubmit = form.title.trim() && form.validFrom && form.validUntil && !createPromo.isPending;

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Crear promoción</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título *"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <select value={form.promoType} onChange={e => setForm({ ...form, promoType: e.target.value })}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
              {Object.entries(PROMO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descripción"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 sm:col-span-2" />
            <input value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} placeholder="Valor del descuento (% o S/.)" type="number" step="0.01"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <input value={form.promoCode} onChange={e => setForm({ ...form, promoCode: e.target.value })} placeholder="Código (opcional)"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Válida desde *
              <input value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })} type="datetime-local"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Válida hasta *
              <input value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} type="datetime-local"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </label>
          </div>
          <button onClick={() => createPromo.mutate()} disabled={!canSubmit}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
            {createPromo.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Crear promoción
          </button>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
