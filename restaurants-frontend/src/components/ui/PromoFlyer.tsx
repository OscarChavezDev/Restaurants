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
      className={`relative flex min-h-[17rem] flex-col justify-between overflow-hidden rounded-3xl p-5 text-white shadow-lg
        bg-gradient-to-br from-orange-500 via-orange-600 to-selva-600 ${className}`}
    >
      {/* Adornos */}
      <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <div aria-hidden className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-black/10" />

      {/* Encabezado */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm">
          <Tag className="h-3 w-3" /> Oferta
        </span>
        {badge && (
          <span className="rounded-xl bg-white px-3 py-1 text-lg font-extrabold leading-none text-orange-600 shadow-sm">
            {badge}<span className="text-xs font-bold"> {promo.promoType === 'PERCENTAGE_DISCOUNT' ? 'OFF' : ''}</span>
          </span>
        )}
      </div>

      {/* Cuerpo */}
      <div className="relative z-10 mt-4">
        <h3 className="font-display text-2xl font-extrabold leading-tight drop-shadow-sm line-clamp-2">{headline}</h3>
        {tagline && <p className="mt-1.5 text-sm text-white/90 line-clamp-2">{tagline}</p>}
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
