'use client';

import { useEffect } from 'react';
import { MapPin, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { Restaurant } from '@/types/restaurant';

interface Props {
  restaurants: Restaurant[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

const COLORS = [
  'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500',
  'bg-violet-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500',
  'bg-pink-500', 'bg-lime-500', 'bg-cyan-500', 'bg-fuchsia-500',
];

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return COLORS[Math.abs(h) % COLORS.length];
}

export function RestaurantPicker({ restaurants, value, onChange, label = 'Selecciona un restaurante' }: Props) {
  useEffect(() => {
    if (restaurants.length === 1 && !value) {
      onChange(restaurants[0].id);
    }
  }, [restaurants, value, onChange]);
  if (!restaurants.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-neutral-800/30 rounded-3xl border border-dashed border-gray-200 dark:border-neutral-800">
        <UtensilsCrossed className="h-10 w-10 mb-4 opacity-40" />
        <p className="text-sm font-medium">No hay restaurantes disponibles</p>
      </div>
    );
  }

  // Si solo hay 1 restaurante, no mostramos el selector en absoluto.
  // El useEffect de arriba ya se encarga de autoseleccionarlo.
  if (restaurants.length === 1) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <UtensilsCrossed className="h-4 w-4 text-orange-500" />
          {label}
        </p>
        {value && restaurants.length > 1 && (
          <button
            onClick={() => onChange('')}
            className="text-xs font-semibold text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Limpiar selección
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {restaurants.map((r) => {
          const selected = r.id === value;
          const color = avatarColor(r.name);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(selected ? '' : r.id)}
              className={cn(
                'group flex items-center gap-3.5 rounded-2xl border-2 p-3 text-left transition-all duration-200 active:scale-[0.98]',
                selected
                  ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-500/10 shadow-sm'
                  : 'border-transparent bg-gray-50 dark:bg-neutral-800/50 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:border-gray-200 dark:hover:border-neutral-700'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white text-lg font-bold shadow-sm transition-transform group-hover:scale-105',
                color
              )}>
                {r.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'text-sm font-bold leading-tight transition-colors line-clamp-2',
                  selected ? 'text-orange-700 dark:text-orange-400' : 'text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400'
                )}>
                  {r.name}
                </p>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-500 dark:text-gray-400 font-medium">
                  <MapPin className="h-3 w-3 flex-shrink-0 opacity-70" />
                  {r.district || r.city || 'Tingo María'}
                </p>
              </div>

              {/* Selected indicator */}
              <div className={cn(
                "flex-shrink-0 h-3 w-3 rounded-full transition-all duration-300",
                selected ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] scale-100" : "bg-transparent scale-0"
              )} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
