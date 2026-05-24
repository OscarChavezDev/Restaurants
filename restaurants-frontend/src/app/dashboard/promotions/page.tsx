'use client';

import { Tag, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { restaurantService } from '@/services/restaurantService';
import { useMyRestaurants, useRestaurants } from '@/hooks/useRestaurants';
import { useAuthStore } from '@/store/authStore';
import { formatCurrency } from '@/utils/formatters';
import { RestaurantPicker } from '@/components/ui/RestaurantPicker';
import type { Promotion } from '@/types/restaurant';

const PROMO_LABELS: Record<string, string> = {
  PERCENTAGE_DISCOUNT: 'Descuento %',
  FIXED_DISCOUNT: 'Descuento fijo',
  COMBO: 'Combo',
  FREE_ITEM: 'Producto gratis',
  HAPPY_HOUR: 'Happy Hour',
};

export default function PromotionsPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin());
  const { data: myRestaurants } = useMyRestaurants();
  const { data: allRestaurants } = useRestaurants(0, 100);
  const restaurants = isAdmin ? allRestaurants : myRestaurants;
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>('');

  const { data: promotions, isLoading } = useQuery({
    queryKey: ['promotions', selectedRestaurantId],
    queryFn: () => restaurantService.getPromotions(selectedRestaurantId),
    enabled: !!selectedRestaurantId,
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Promociones</h1>
        <p className="text-gray-600 mt-1">Descuentos y ofertas activas por restaurante</p>
      </div>

      <RestaurantPicker
        restaurants={restaurants?.content ?? []}
        value={selectedRestaurantId}
        onChange={setSelectedRestaurantId}
        label="Selecciona un restaurante para ver sus promociones"
      />

      {!selectedRestaurantId ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p>Selecciona un restaurante para ver sus promociones</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[1,2,3].map(i => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      ) : !promotions?.length ? (
        <div className="text-center py-20 text-gray-400">
          <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="mb-2">Sin promociones activas</p>
          <p className="text-xs">Crea promociones usando la API: <code className="bg-gray-100 px-1 rounded">POST /v1/promotions</code></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {promotions.map((promo: Promotion) => (
            <div key={promo.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                  {PROMO_LABELS[promo.promoType]}
                </span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${promo.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {promo.isActive ? 'Activa' : 'Inactiva'}
                </span>
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
