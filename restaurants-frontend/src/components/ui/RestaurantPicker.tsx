'use client';

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
  if (!restaurants.length) {
    return (
      <div className="flex flex-col items-center py-10 text-gray-400">
        <UtensilsCrossed className="h-10 w-10 mb-3 opacity-30" />
        <p className="text-sm">No hay restaurantes disponibles</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
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
                'flex items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-all duration-150',
                selected
                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-orange-50/40 shadow-sm'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white text-base font-bold',
                color
              )}>
                {r.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={cn(
                  'truncate text-sm font-semibold leading-tight',
                  selected ? 'text-orange-700' : 'text-gray-900'
                )}>
                  {r.name}
                </p>
                <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  {r.district || r.city || 'Tingo María'}
                </p>
              </div>

              {/* Selected indicator */}
              {selected && (
                <div className="flex-shrink-0 h-2 w-2 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}
      </div>

      {value && (
        <button
          onClick={() => onChange('')}
          className="mt-2 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          Deseleccionar
        </button>
      )}
    </div>
  );
}
