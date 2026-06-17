'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UtensilsCrossed, Leaf, Wheat, Loader2 } from 'lucide-react';
import { useRestaurantMenus, useMenuDishes } from '@/hooks/useRestaurants';
import { cn } from '@/utils/cn';
import type { Menu } from '@/types/restaurant';

function DishList({ menuId }: { menuId: string }) {
  const { data: dishes, isLoading } = useMenuDishes(menuId);

  if (isLoading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
    </div>
  );

  const available = dishes?.filter(d => d.isAvailable) ?? [];
  const unavailable = dishes?.filter(d => !d.isAvailable) ?? [];
  const all = [...available, ...unavailable];

  if (all.length === 0) return (
    <p className="text-sm text-gray-400 py-4 text-center">Sin platos disponibles.</p>
  );

  return (
    <div className="divide-y divide-gray-50">
      {all.map(dish => (
        <div
          key={dish.id}
          className={cn(
            'flex gap-4 py-4',
            !dish.isAvailable && 'opacity-40'
          )}
        >
          {dish.imageUrl ? (
            <div className="relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
              <Image src={dish.imageUrl} alt={dish.name} fill className="object-cover" />
            </div>
          ) : (
            <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-orange-50 flex items-center justify-center">
              <UtensilsCrossed className="h-7 w-7 text-orange-200" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className={cn(
                  'text-sm font-semibold text-gray-900',
                  !dish.isAvailable && 'line-through text-gray-400'
                )}>
                  {dish.name}
                  {!dish.isAvailable && <span className="ml-2 text-xs font-normal text-red-400">(No disponible)</span>}
                </h4>
                {dish.description && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{dish.description}</p>
                )}
                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {dish.isVegetarian && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      <Leaf className="h-2.5 w-2.5" /> Vegetariano
                    </span>
                  )}
                  {dish.isVegan && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">
                      <Leaf className="h-2.5 w-2.5" /> Vegano
                    </span>
                  )}
                  {dish.isGlutenFree && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                      <Wheat className="h-2.5 w-2.5" /> Sin gluten
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm font-bold text-orange-600 whitespace-nowrap flex-shrink-0">
                S/ {Number(dish.price).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MenuTab({ menu, isActive, onClick }: { menu: Menu; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap',
        isActive
          ? 'bg-orange-500 text-white'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      )}
    >
      {menu.name}
    </button>
  );
}

export function MenuSection({ restaurantId }: { restaurantId: string }) {
  const { data: menus, isLoading } = useRestaurantMenus(restaurantId);
  const activeMenus = menus?.filter(m => m.isActive) ?? [];
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const selectedId = activeMenuId ?? activeMenus[0]?.id ?? null;

  if (isLoading) return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <div className="h-6 w-32 skeleton rounded mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton rounded-xl" />)}
      </div>
    </div>
  );

  if (activeMenus.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
      <h2 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4 flex items-center gap-2">
        <UtensilsCrossed className="h-5 w-5 text-orange-500" /> Menú
      </h2>

      {activeMenus.length > 1 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {activeMenus.map(menu => (
            <MenuTab
              key={menu.id}
              menu={menu}
              isActive={menu.id === selectedId}
              onClick={() => setActiveMenuId(menu.id)}
            />
          ))}
        </div>
      )}

      {selectedId && <DishList menuId={selectedId} />}
    </div>
  );
}
