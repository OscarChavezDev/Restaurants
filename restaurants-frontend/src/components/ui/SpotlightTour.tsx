'use client';

import { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { X, ArrowRight, ArrowLeft, PartyPopper } from 'lucide-react';
import { cn } from '@/utils/cn';

export type TourStep = {
  selector?: string; // si no hay selector, es un paso centrado (intro)
  title: string;
  text: string;
};

/**
 * Motor de guía interactiva (spotlight) reutilizable. Aparece una sola vez
 * (según `storageKey`) cuando `active` es true. Resalta elementos reales por CSS.
 */
export function SpotlightTour({
  steps, storageKey, active,
}: {
  steps: TourStep[];
  storageKey: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof window !== 'undefined' && !localStorage.getItem(storageKey)) {
      const t = setTimeout(() => { setIndex(0); setOpen(true); }, 900);
      return () => clearTimeout(t);
    }
  }, [active, storageKey]);

  const step = steps[index];

  const measure = useCallback(() => {
    const sel = steps[index]?.selector;
    if (!sel) { setRect(null); return; }
    const el = document.querySelector(sel);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    // Si el elemento no está visible en pantalla (p. ej. sidebar oculto en
    // móvil), mostramos la tarjeta centrada en vez de un spotlight perdido.
    const onScreen = r.width > 0 && r.height > 0
      && r.right > 4 && r.left < window.innerWidth - 4
      && r.bottom > 4 && r.top < window.innerHeight - 4;
    setRect(onScreen ? r : null);
  }, [index, steps]);

  useLayoutEffect(() => {
    if (!open) return;
    const sel = steps[index]?.selector;
    const el = sel ? document.querySelector(sel) : null;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    measure();
    const t = setTimeout(measure, 380);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, index, measure, steps]);

  const finish = useCallback(() => {
    try { localStorage.setItem(storageKey, 'true'); } catch { /* ignore */ }
    setOpen(false);
  }, [storageKey]);

  if (!open) return null;

  const isLast = index === steps.length - 1;
  const isFirst = index === 0;

  const PAD = 8;
  const TW = 340;
  const TH = 230;
  let positioned: React.CSSProperties | null = null;
  if (rect) {
    const gap = 14;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(TW, vw - 24); // responsive: nunca más ancho que la pantalla
    const clampTop = (t: number) => Math.max(12, Math.min(t, vh - TH - 12));
    let left: number;
    let top: number;
    if (vw - rect.right >= cardW + gap) {
      // Hay espacio a la derecha del elemento (típico de la barra lateral).
      left = rect.right + gap;
      top = clampTop(rect.top);
    } else if (rect.left >= cardW + gap) {
      // Espacio a la izquierda.
      left = rect.left - cardW - gap;
      top = clampTop(rect.top);
    } else {
      // Sin espacio a los lados: debajo o encima, sin tapar el elemento.
      left = Math.max(12, Math.min(rect.left + rect.width / 2 - cardW / 2, vw - cardW - 12));
      const below = rect.bottom + TH + gap < vh;
      top = below ? rect.bottom + gap : Math.max(12, rect.top - TH - gap);
    }
    positioned = { position: 'fixed', top, left, width: cardW };
  }

  const cardClass = 'bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-pop-in';

  const cardInner = (
    <>
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-orange-600 to-selva-500" />
      <button onClick={finish} className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" aria-label="Cerrar">
        <X className="h-4 w-4" />
      </button>

      <div className="px-6 pt-7 pb-4">
        {isFirst && (
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 animate-pop">
            <PartyPopper className="h-6 w-6" />
          </div>
        )}
        <span className="text-xs font-semibold uppercase tracking-widest text-orange-500">
          Paso {index + 1} de {steps.length}
        </span>
        <h2 className="font-display text-lg font-bold text-gray-900 dark:text-gray-50 mt-1 mb-1.5">{step.title}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{step.text}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 px-6 pb-3">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Ir al paso ${i + 1}`}
            className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-5 bg-orange-500' : 'w-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300')}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 dark:border-gray-700">
        {!isFirst ? (
          <button onClick={() => setIndex(index - 1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-200">
            <ArrowLeft className="h-4 w-4" /> Anterior
          </button>
        ) : (
          <button onClick={finish} className="text-sm font-medium text-gray-400 hover:text-gray-600">Saltar</button>
        )}
        <button
          onClick={() => (isLast ? finish() : setIndex(index + 1))}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all active:scale-95"
        >
          {isLast ? '¡Listo!' : 'Siguiente'} {!isLast && <ArrowRight className="h-4 w-4" />}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className={cn('fixed inset-0 z-[70]', rect ? 'bg-transparent' : 'bg-black/60 backdrop-blur-sm')}
        onClick={finish}
        aria-hidden
      />

      {rect && (
        <div
          className="pointer-events-none fixed z-[71] rounded-2xl ring-4 ring-orange-400 transition-all duration-300 ease-out"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
          }}
        />
      )}

      {rect ? (
        <div style={positioned!} className={cn('z-[72]', cardClass)}>
          {cardInner}
        </div>
      ) : (
        <div className="fixed inset-0 z-[72] flex items-center justify-center p-4 pointer-events-none">
          <div className={cn('relative pointer-events-auto w-full', cardClass)} style={{ maxWidth: TW }}>
            {cardInner}
          </div>
        </div>
      )}
    </>
  );
}
