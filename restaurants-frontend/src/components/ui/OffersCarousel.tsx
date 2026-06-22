'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { restaurantService } from '@/services/restaurantService';
import { PromoFlyer } from '@/components/ui/PromoFlyer';

/**
 * Carrusel horizontal de ofertas (flyers) de todos los restaurantes, para la
 * página principal. Avanza con flechas (no barra de scroll). Se oculta si no hay
 * ofertas con flyer generado.
 */
export function OffersCarousel() {
  const scroller = useRef<HTMLDivElement>(null);

  const { data: offers } = useQuery({
    queryKey: ['promotions-showcase'],
    queryFn: () => restaurantService.getPromotionsShowcase(),
    staleTime: 5 * 60 * 1000,
  });

  if (!offers || offers.length === 0) return null;

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.9, 360), behavior: 'smooth' });
  };

  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-orange-500" /> Ofertas de hoy
        </h2>
        <div className="hidden sm:flex items-center gap-2">
          <button onClick={() => scrollBy(-1)} aria-label="Anterior" className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => scrollBy(1)} aria-label="Siguiente" className="p-2 rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {offers.map((promo) => {
          const card = <PromoFlyer promo={promo} className="h-full w-full" />;
          return (
            <div key={promo.id} className="flex snap-start shrink-0 w-72 sm:w-80">
              {promo.restaurantSlug ? (
                <Link href={`/restaurants/${promo.restaurantSlug}`} className="flex w-full transition-transform hover:-translate-y-0.5">
                  {card}
                </Link>
              ) : card}
            </div>
          );
        })}
      </div>
    </section>
  );
}
