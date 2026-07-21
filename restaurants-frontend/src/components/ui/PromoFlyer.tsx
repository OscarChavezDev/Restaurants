'use client';

import { MapPin, Sparkles, Tag } from 'lucide-react';
import type { Promotion } from '@/types/restaurant';
import { cn } from '@/utils/cn';

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
 * Flyer de promoción, formato póster (4:5). El fondo es la imagen generada por
 * IA (Gemini, ver PromotionService.generateFlyer) subida a Cloudinary; si aún
 * no existe (no configurado / falló / no generado), cae a un degradado de
 * marca. El titular/subtítulo vienen del copy de IA (flyerHeadline/flyerTagline);
 * si no hay, usa el título/descripción de la promoción.
 */
export function PromoFlyer({ promo, className = '' }: { promo: Promotion; className?: string }) {
  const headline = promo.flyerHeadline?.trim() || promo.title;
  const tagline = promo.flyerTagline?.trim() || promo.description;
  const badge = discountBadge(promo);
  const hasImage = !!promo.flyerImageUrl;

  return (
    <div
      className={cn(
        'relative aspect-[1/1.15] w-full overflow-hidden rounded-2xl shadow-xl shadow-black/20 text-white',
        !hasImage && 'bg-gradient-to-br from-orange-500 via-orange-600 to-selva-600',
        className,
      )}
    >
      {hasImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={promo.flyerImageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Velo para legibilidad del texto: siempre presente, más marcado sobre foto */}
      <div
        aria-hidden
        className={cn(
          'absolute inset-0',
          hasImage
            ? 'bg-gradient-to-t from-black/90 via-black/30 to-black/10'
            : undefined,
        )}
      />
      {!hasImage && (
        <>
          <div aria-hidden className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div aria-hidden className="pointer-events-none absolute -bottom-10 -left-8 h-32 w-32 rounded-full bg-black/10" />
        </>
      )}

      <div className="relative z-10 flex h-full flex-col justify-between p-2.5">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider backdrop-blur-md ring-1 ring-white/20">
            <Tag className="h-2 w-2" /> Oferta
          </span>
          {badge && (
            <span className="flex h-7 w-7 shrink-0 flex-col items-center justify-center rounded-full bg-white text-orange-600 shadow-lg ring-2 ring-white/25">
              <span className="text-[9px] font-black leading-none">{badge}</span>
              {promo.promoType === 'PERCENTAGE_DISCOUNT' && <span className="text-[5px] font-bold leading-none">OFF</span>}
            </span>
          )}
        </div>

        {/* Cuerpo */}
        <div className="mt-auto">
          <h3 className="font-display text-xs font-extrabold leading-tight drop-shadow-md line-clamp-2">{headline}</h3>
          {tagline && <p className="mt-1 text-[9px] text-white/85 line-clamp-1 leading-snug">{tagline}</p>}

          {promo.promoCode && (
            <div className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-dashed border-white/40 bg-white/10 px-1.5 py-0.5 backdrop-blur-sm">
              <span className="text-[6px] font-bold uppercase tracking-wider text-white/70">Código</span>
              <code className="text-[9px] font-black tracking-wide">{promo.promoCode}</code>
            </div>
          )}

          <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-white/20 pt-1.5">
            <span className="inline-flex min-w-0 items-center gap-1 text-[8px] font-semibold text-white/90">
              <MapPin className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{promo.restaurantName ?? 'Restaurante'}</span>
            </span>
            {hasImage && (
              <span className="inline-flex shrink-0 items-center gap-1 text-[7px] font-bold uppercase tracking-wider text-white/50">
                <Sparkles className="h-2 w-2" /> IA
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
