'use client';

import { MapPin, Tag } from 'lucide-react';
import type { Promotion } from '@/types/restaurant';

/** Etiqueta del descuento según el tipo de promoción. */
function discountBadge(p: Promotion): string | null {
  if (p.promoType === 'PERCENTAGE_DISCOUNT' && p.discountValue) return `${p.discountValue}%`;
  if (p.promoType === 'FIXED_DISCOUNT' && p.discountValue) return `S/ ${Number(p.discountValue).toFixed(0)}`;
  if (p.promoType === 'FREE_ITEM') return 'GRATIS';
  if (p.promoType === 'COMBO') return 'COMBO';
  if (p.promoType === 'HAPPY_HOUR') return 'HAPPY';
  return null;
}

/**
 * Flyer de promoción diseñado por el sistema (paleta Brasa & Selva). El titular
 * y el subtítulo provienen del copy generado por IA (flyerHeadline/flyerTagline);
 * si no hay, usa el título/descripción de la promoción.
 */
export function PromoFlyer({ promo, className = '' }: { promo: Promotion; className?: string }) {
  const headline = promo.flyerHeadline?.trim() || promo.title;
  const tagline = promo.flyerTagline?.trim() || promo.description;
  const badge = discountBadge(promo);

  return (
    <div
      className={`relative flex min-h-[11rem] flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-lg
        bg-gradient-to-br from-orange-500 via-orange-600 to-selva-600 ${className}`}
    >
      {/* Adornos */}
      <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-8 -left-6 h-24 w-24 rounded-full bg-black/10" />

      {/* Encabezado */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
          <Tag className="h-3 w-3" /> Oferta
        </span>
        {badge && (
          <span className="rounded-lg bg-white px-2 py-1 text-sm font-extrabold leading-none text-orange-600 shadow-sm">
            {badge}<span className="text-[10px] font-bold"> {promo.promoType === 'PERCENTAGE_DISCOUNT' ? 'OFF' : ''}</span>
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="relative z-10 mt-3">
        <h3 className="font-display text-lg font-extrabold leading-tight drop-shadow-sm line-clamp-2">{headline}</h3>
        {tagline && <p className="mt-1 text-xs text-white/90 line-clamp-2">{tagline}</p>}
      </div>

      {/* Pie */}
      <div className="relative z-10 mt-4 flex items-center justify-between gap-2 border-t border-white/20 pt-3">
        <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-white/90">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">{promo.restaurantName ?? 'Restaurante'}</span>
        </span>
        {promo.promoCode && (
          <code className="flex-shrink-0 rounded-md bg-white/20 px-2 py-1 text-xs font-bold tracking-wide backdrop-blur-sm">
            {promo.promoCode}
          </code>
        )}
      </div>
    </div>
  );
}
