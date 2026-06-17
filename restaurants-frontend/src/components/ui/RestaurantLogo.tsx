'use client';

import { useState } from 'react';
import { cn } from '@/utils/cn';

// Avatar de respaldo cuando el logo no existe o la URL está rota.
const COLORS = [
  'bg-orange-500', 'bg-amber-500', 'bg-red-500', 'bg-emerald-500',
  'bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-teal-500',
];

function pickColor(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export function RestaurantLogo({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl?: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const showImage = !!logoUrl && !error;
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();

  return (
    <div
      className={cn(
        'relative overflow-hidden flex-shrink-0 flex items-center justify-center',
        className,
        !showImage && `${pickColor(name ?? '')} text-white`
      )}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="font-display font-bold">{initial}</span>
      )}
    </div>
  );
}
